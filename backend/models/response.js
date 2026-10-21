import { getDb } from '../db/index.js'
import { nanoid } from 'nanoid'

export const ResponseModel = {
  findByUserAndSurvey(userId, surveyId) {
    return getDb().prepare(
      'SELECT * FROM survey_responses WHERE user_id = ? AND survey_id = ?'
    ).get(userId, surveyId)
  },

  findBySurvey(surveyId, { limit = 100, offset = 0 } = {}) {
    return getDb().prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
      FROM survey_responses r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.survey_id = ?
      ORDER BY r.submitted_at DESC, r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(surveyId, limit, offset)
  },

  countBySurvey(surveyId) {
    return getDb().prepare(
      'SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ? AND is_complete = 1'
    ).get(surveyId).count
  },

  upsert(userId, surveyId, responseData, isComplete = false) {
    const db = getDb()
    const existing = this.findByUserAndSurvey(userId, surveyId)

    if (existing) {
      if (existing.is_complete) {
        throw new Error('ALREADY_COMPLETED')
      }
      db.prepare(`
        UPDATE survey_responses
        SET response = ?, is_complete = ?, submitted_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND survey_id = ?
      `).run(
        JSON.stringify(responseData),
        isComplete ? 1 : 0,
        isComplete ? new Date().toISOString() : null,
        userId,
        surveyId
      )
      return this.findByUserAndSurvey(userId, surveyId)
    } else {
      const id = nanoid()
      db.prepare(`
        INSERT INTO survey_responses (id, survey_id, user_id, response, is_complete, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        surveyId,
        userId,
        JSON.stringify(responseData),
        isComplete ? 1 : 0,
        isComplete ? new Date().toISOString() : null
      )
      return this.findByUserAndSurvey(userId, surveyId)
    }
  },

  getStats(surveyId) {
    const db = getDb()
    return {
      total: db.prepare('SELECT COUNT(*) as c FROM survey_responses WHERE survey_id = ?').get(surveyId).c,
      completed: db.prepare('SELECT COUNT(*) as c FROM survey_responses WHERE survey_id = ? AND is_complete = 1').get(surveyId).c,
      inProgress: db.prepare('SELECT COUNT(*) as c FROM survey_responses WHERE survey_id = ? AND is_complete = 0').get(surveyId).c
    }
  },

  getGlobalStats() {
    const db = getDb()
    return {
      totalSurveys: db.prepare('SELECT COUNT(*) as c FROM surveys').get().c,
      activeSurveys: db.prepare('SELECT COUNT(*) as c FROM surveys WHERE is_active = 1').get().c,
      totalResponses: db.prepare('SELECT COUNT(*) as c FROM survey_responses WHERE is_complete = 1').get().c,
      totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
      recentActivity: db.prepare(`
        SELECT r.submitted_at, r.survey_id, s.title as survey_title, u.name as user_name, u.avatar as user_avatar
        FROM survey_responses r
        JOIN surveys s ON r.survey_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE r.is_complete = 1
        ORDER BY r.submitted_at DESC
        LIMIT 10
      `).all()
    }
  }
}
