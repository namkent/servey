import express from 'express'
import { ResponseModel } from '../models/response.js'
import { SurveyModel } from '../models/survey.js'
import { requireAuth, requireManagerOrAdmin, canManageSurvey } from '../middleware/auth.js'

const router = express.Router({ mergeParams: true })

// GET /api/surveys/:id/response - Get current user's response
router.get('/', requireAuth, (req, res) => {
  try {
    const response = ResponseModel.findByUserAndSurvey(req.session.user.id, req.params.id)
    if (!response) return res.json({ exists: false, response: null })
    res.json({
      exists: true,
      response: {
        ...response,
        response: JSON.parse(response.response || '{}'),
        is_complete: !!response.is_complete,
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/surveys/:id/response - Save or submit response
router.post('/', requireAuth, (req, res) => {
  try {
    const survey = SurveyModel.findById(req.params.id)
    if (!survey) return res.status(404).json({ error: 'Survey not found' })
    if (!survey.is_active) return res.status(403).json({ error: 'Survey is not active' })

    // Check expiry
    if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Survey has expired' })
    }

    const { data, isComplete = false } = req.body

    const saved = ResponseModel.upsert(
      req.session.user.id,
      req.params.id,
      data,
      isComplete
    )

    res.json({
      ...saved,
      response: JSON.parse(saved.response || '{}'),
      is_complete: !!saved.is_complete,
    })
  } catch (err) {
    if (err.message === 'ALREADY_COMPLETED') {
      return res.status(409).json({ error: 'Survey already completed', message: 'You have already submitted this survey.' })
    }
    res.status(500).json({ error: err.message })
  }
})

// GET /api/surveys/:id/results - Manager / Admin: all responses
router.get('/results', requireManagerOrAdmin, (req, res) => {
  try {
    const survey = SurveyModel.findById(req.params.id)
    if (!survey) return res.status(404).json({ error: 'Survey not found' })

    if (!canManageSurvey(req.session.user, survey)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem kết quả bài khảo sát của phòng ban này.' })
    }

    const { limit = 100, offset = 0 } = req.query
    const responses = ResponseModel.findBySurvey(req.params.id, { limit: +limit, offset: +offset })
    const stats = ResponseModel.getStats(req.params.id)

    res.json({
      stats,
      responses: responses.map(r => ({
        ...r,
        response: JSON.parse(r.response || '{}'),
        is_complete: !!r.is_complete,
      }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
