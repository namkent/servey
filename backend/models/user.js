import { getDb } from '../db/index.js'
import { nanoid } from 'nanoid'

export const UserModel = {
  findById(id) {
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id)
  },

  findByEmail(email) {
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email)
  },

  create({ id, name, email, avatar, provider, role: initialRole, department = '', departments = '' }) {
    const db = getDb()
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const role = initialRole || (adminEmails.includes(email) ? 'admin' : 'user')

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, avatar, role, department, departments, provider)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        avatar = excluded.avatar,
        provider = excluded.provider,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `)
    return stmt.get(id || nanoid(), name, email, avatar, role, department, departments, provider)
  },

  updateRole(id, role, departments = '', department = '') {
    return getDb().prepare(`
      UPDATE users
      SET role = ?, departments = ?, department = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, departments, department, id)
  },

  list({ limit = 100, offset = 0 } = {}) {
    return getDb().prepare(`
      SELECT id, name, email, avatar, role, department, departments, provider, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset)
  },

  count() {
    return getDb().prepare('SELECT COUNT(*) as count FROM users').get().count
  }
}
