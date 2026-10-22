import { DatabaseSync } from 'node:sqlite'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let db = null

export function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || './data/survey.db'
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true })
    }

    db = new DatabaseSync(dbPath)

    // Helper compatibility methods
    if (!db.pragma) {
      db.pragma = function (sql) {
        const query = sql.trim().toUpperCase().startsWith('PRAGMA') ? sql : `PRAGMA ${sql}`
        return db.exec(query)
      }
    }

    if (!db.transaction) {
      db.transaction = function (fn) {
        return function (...args) {
          db.exec('BEGIN')
          try {
            const result = fn.apply(this, args)
            db.exec('COMMIT')
            return result
          } catch (err) {
            db.exec('ROLLBACK')
            throw err
          }
        }
      }
    }

    db.exec('PRAGMA journal_mode = WAL;')
    db.exec('PRAGMA foreign_keys = ON;')
    initSchema()
  }
  return db
}

function initSchema() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  db.exec(schema)

  // Ensure department and departments columns exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id         TEXT PRIMARY KEY,
        name       TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count
    if (deptCount === 0) {
      const defaults = [
        'Chung', 'IT', 'HR', 'Sản xuất', 'Kế toán',
        'Kinh doanh', 'Marketing', 'QA/QC', 'Hành chính', 'Ban giám đốc'
      ]
      const insertStmt = db.prepare('INSERT OR IGNORE INTO departments (id, name) VALUES (?, ?)')
      for (const name of defaults) {
        insertStmt.run(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name)
      }
    }

    const surveyCols = db.prepare('PRAGMA table_info(surveys)').all()
    if (!surveyCols.some(c => c.name === 'department')) {
      db.exec("ALTER TABLE surveys ADD COLUMN department TEXT DEFAULT 'Chung'")
    }

    const userCols = db.prepare('PRAGMA table_info(users)').all()
    if (!userCols.some(c => c.name === 'departments')) {
      db.exec("ALTER TABLE users ADD COLUMN department TEXT DEFAULT ''")
      db.exec("ALTER TABLE users ADD COLUMN departments TEXT DEFAULT ''")
    }
  } catch (e) {
    console.error('[DB] Migration check warning:', e.message)
  }
}


export default getDb
