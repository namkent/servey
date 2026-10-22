import { getDb } from '../db/index.js'
import { nanoid } from 'nanoid'

export const DepartmentModel = {
  list() {
    const rows = getDb().prepare(`
      SELECT name FROM departments
      ORDER BY (CASE WHEN name = 'Chung' THEN 0 ELSE 1 END), name ASC
    `).all()
    return rows.map(r => r.name)
  },

  create(name) {
    const trimmed = (name || '').trim()
    if (!trimmed) throw new Error('Tên phòng ban không được để trống')
    const id = nanoid(8)
    getDb().prepare('INSERT INTO departments (id, name) VALUES (?, ?)').run(id, trimmed)
    return trimmed
  },

  update(oldName, newName) {
    const trimmedOld = (oldName || '').trim()
    const trimmedNew = (newName || '').trim()
    if (!trimmedNew) throw new Error('Tên phòng ban mới không được để trống')
    if (trimmedOld === 'Chung') throw new Error('Không thể đổi tên phòng ban mặc định "Chung"')

    const db = getDb()
    db.transaction(() => {
      // Update department table
      db.prepare('UPDATE departments SET name = ? WHERE name = ?').run(trimmedNew, trimmedOld)
      // Update surveys
      db.prepare('UPDATE surveys SET department = ? WHERE department = ?').run(trimmedNew, trimmedOld)

      // Update users' assigned departments
      const usersWithDept = db.prepare('SELECT id, department, departments FROM users').all()
      for (const u of usersWithDept) {
        let changed = false
        let userDept = u.department
        let userDepts = []
        if (userDept === trimmedOld) {
          userDept = trimmedNew
          changed = true
        }
        if (u.departments) {
          try {
            const arr = JSON.parse(u.departments)
            if (Array.isArray(arr) && arr.includes(trimmedOld)) {
              userDepts = arr.map(d => d === trimmedOld ? trimmedNew : d)
              changed = true
            }
          } catch {}
        }
        if (changed) {
          db.prepare('UPDATE users SET department = ?, departments = ? WHERE id = ?').run(
            userDept,
            JSON.stringify(userDepts),
            u.id
          )
        }
      }
    })()

    return trimmedNew
  },

  delete(name) {
    const trimmed = (name || '').trim()
    if (trimmed === 'Chung') throw new Error('Không thể xoá phòng ban mặc định "Chung"')

    const db = getDb()
    db.transaction(() => {
      // Delete from departments table
      db.prepare('DELETE FROM departments WHERE name = ?').run(trimmed)
      // Fallback any surveys in this department to 'Chung'
      db.prepare("UPDATE surveys SET department = 'Chung' WHERE department = ?").run(trimmed)

      // Remove from users' assigned departments
      const users = db.prepare('SELECT id, department, departments FROM users').all()
      for (const u of users) {
        let changed = false
        let userDept = u.department === trimmed ? '' : u.department
        let userDepts = []
        if (u.departments) {
          try {
            const arr = JSON.parse(u.departments)
            if (Array.isArray(arr) && arr.includes(trimmed)) {
              userDepts = arr.filter(d => d !== trimmed)
              changed = true
            }
          } catch {}
        }
        if (u.department === trimmed) changed = true
        if (changed) {
          db.prepare('UPDATE users SET department = ?, departments = ? WHERE id = ?').run(
            userDept,
            JSON.stringify(userDepts),
            u.id
          )
        }
      }
    })()

    return true
  }
}

export default DepartmentModel
