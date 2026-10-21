import { getDb } from '../db/index.js'
import { nanoid } from 'nanoid'
import { generateSlug } from '../lib/slugify.js'

export const SurveyModel = {
  findById(id) {
    return getDb().prepare('SELECT * FROM surveys WHERE id = ?').get(id)
  },

  list({ activeOnly = true, user = null, department = null, limit = 50, offset = 0 } = {}) {
    const db = getDb()
    const conditions = []
    const params = []

    if (activeOnly) {
      conditions.push('s.is_active = 1')
    }

    if (department) {
      conditions.push('s.department = ?')
      params.push(department)
    }

    // Role-based filtering for managers:
    if (user && user.role === 'manager') {
      const depts = parseDepartments(user)
      if (depts.length > 0) {
        const placeholders = depts.map(() => '?').join(', ')
        conditions.push(`(s.department IN (${placeholders}) OR s.created_by = ?)`)
        params.push(...depts, user.id)
      } else {
        conditions.push('s.created_by = ?')
        params.push(user.id)
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const surveys = db.prepare(`
      SELECT s.*, u.name as creator_name,
        (SELECT COUNT(*) FROM survey_responses r WHERE r.survey_id = s.id AND r.is_complete = 1) as response_count
      FROM surveys s
      LEFT JOIN users u ON s.created_by = u.id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset)
    return surveys
  },

  count({ activeOnly = false, user = null, department = null } = {}) {
    const db = getDb()
    const conditions = []
    const params = []

    if (activeOnly) conditions.push('s.is_active = 1')
    if (department) {
      conditions.push('s.department = ?')
      params.push(department)
    }
    if (user && user.role === 'manager') {
      const depts = parseDepartments(user)
      if (depts.length > 0) {
        const placeholders = depts.map(() => '?').join(', ')
        conditions.push(`(s.department IN (${placeholders}) OR s.created_by = ?)`)
        params.push(...depts, user.id)
      } else {
        conditions.push('s.created_by = ?')
        params.push(user.id)
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return db.prepare(`SELECT COUNT(*) as count FROM surveys s ${where}`).get(...params).count
  },

  create({ title, description, department = 'Chung', schema, createdBy, isPublic = 1, expiresAt = null, slug = null }) {
    const db = getDb()
    let baseSlug = slug ? generateSlug(slug) : generateSlug(title)
    // Guarantee slug always includes an ID suffix so surveys with identical titles never collide
    if (!/-[a-z0-9]{4,8}$/.test(baseSlug)) {
      baseSlug = `${baseSlug}-${nanoid(5).toLowerCase()}`
    }
    const id = ensureUniqueSlug(db, baseSlug)

    const stmt = db.prepare(`
      INSERT INTO surveys (id, title, description, department, schema, created_by, is_public, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, title, description || null, department || 'Chung', JSON.stringify(schema), createdBy, isPublic ? 1 : 0, expiresAt || null)
    return this.findById(id)
  },

  update(id, { title, description, department, schema, isActive, isPublic, expiresAt }) {
    const db = getDb()
    const fields = []
    const values = []

    if (title !== undefined) { fields.push('title = ?'); values.push(title) }
    if (description !== undefined) { fields.push('description = ?'); values.push(description) }
    if (department !== undefined) { fields.push('department = ?'); values.push(department) }
    if (schema !== undefined) { fields.push('schema = ?'); values.push(JSON.stringify(schema)) }
    if (isActive !== undefined) { fields.push('is_active = ?'); values.push(isActive ? 1 : 0) }
    if (isPublic !== undefined) { fields.push('is_public = ?'); values.push(isPublic ? 1 : 0) }
    if (expiresAt !== undefined) { fields.push('expires_at = ?'); values.push(expiresAt) }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    db.prepare(`UPDATE surveys SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  },

  delete(id) {
    return getDb().prepare('DELETE FROM surveys WHERE id = ?').run(id)
  }
}

export function parseDepartments(user) {
  if (!user) return []
  if (Array.isArray(user.departments)) return user.departments
  if (typeof user.departments === 'string' && user.departments.trim()) {
    try {
      const parsed = JSON.parse(user.departments)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return user.departments.split(',').map(d => d.trim()).filter(Boolean)
    }
  }
  if (user.department) return [user.department]
  return []
}

function ensureUniqueSlug(db, base) {
  const existing = db.prepare('SELECT id FROM surveys WHERE id = ?').get(base)
  if (!existing) return base

  let counter = 2
  while (true) {
    const candidate = `${base}-${counter}`
    const exists = db.prepare('SELECT id FROM surveys WHERE id = ?').get(candidate)
    if (!exists) return candidate
    counter++
  }
}
