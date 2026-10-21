import express from 'express'
import { SurveyModel, parseDepartments } from '../models/survey.js'
import { ResponseModel } from '../models/response.js'
import { requireAuth, requireManagerOrAdmin, canManageSurvey } from '../middleware/auth.js'

const router = express.Router()

// GET /api/surveys - Public list of active surveys
router.get('/', requireAuth, (req, res) => {
  try {
    const { limit = 50, offset = 0, department } = req.query
    const surveys = SurveyModel.list({ activeOnly: true, department: department || null, limit: +limit, offset: +offset })
    const total = SurveyModel.count({ activeOnly: true, department: department || null })
    res.json({ surveys, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/surveys/all - Manager / Admin: surveys list based on role & department
router.get('/all', requireManagerOrAdmin, (req, res) => {
  try {
    const { limit = 100, offset = 0, department } = req.query
    const surveys = SurveyModel.list({
      activeOnly: false,
      user: req.session.user,
      department: department || null,
      limit: +limit,
      offset: +offset
    })
    const total = SurveyModel.count({
      activeOnly: false,
      user: req.session.user,
      department: department || null
    })
    res.json({ surveys, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/surveys/:id - Get survey by slug
router.get('/:id', requireAuth, (req, res) => {
  try {
    const survey = SurveyModel.findById(req.params.id)
    if (!survey) return res.status(404).json({ error: 'Survey not found' })
    if (!survey.is_active && !canManageSurvey(req.session.user, survey)) {
      return res.status(403).json({ error: 'Khảo sát hiện không hoạt động' })
    }
    res.json({
      ...survey,
      schema: JSON.parse(survey.schema || '{}'),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/surveys/:id/results - Manager / Admin: get responses and statistics
router.get('/:id/results', requireManagerOrAdmin, (req, res) => {
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
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        department: survey.department,
        schema: JSON.parse(survey.schema || '{}'),
      },
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

// POST /api/surveys - Create survey (Manager / Admin)
router.post('/', requireManagerOrAdmin, (req, res) => {
  try {
    const { title, description, department = 'Chung', schema, isPublic, expiresAt, slug } = req.body
    if (!title) return res.status(400).json({ error: 'Tiêu đề khảo sát là bắt buộc' })
    if (!schema) return res.status(400).json({ error: 'Nội dung câu hỏi (schema) là bắt buộc' })

    // Validate department permission for managers
    const user = req.session.user
    if (user.role === 'manager') {
      const allowedDepts = parseDepartments(user)
      if (allowedDepts.length > 0 && !allowedDepts.includes(department)) {
        return res.status(403).json({
          error: `Bạn chỉ được tạo bài khảo sát cho các phòng ban được phân quyền: ${allowedDepts.join(', ')}`
        })
      }
    }

    const survey = SurveyModel.create({
      title,
      description,
      department: department || 'Chung',
      schema,
      createdBy: user.id,
      isPublic: isPublic !== false,
      expiresAt: expiresAt || null,
      slug: slug || null,
    })
    res.status(201).json({ ...survey, schema: JSON.parse(survey.schema || '{}') })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/surveys/:id - Update survey (Manager / Admin)
router.put('/:id', requireManagerOrAdmin, (req, res) => {
  try {
    const existing = SurveyModel.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Khảo sát không tồn tại' })

    if (!canManageSurvey(req.session.user, existing)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa khảo sát của phòng ban này.' })
    }

    const { title, description, department, schema, isActive, isPublic, expiresAt } = req.body

    // If changing department as manager, verify destination department
    if (department && req.session.user.role === 'manager') {
      const allowedDepts = parseDepartments(req.session.user)
      if (allowedDepts.length > 0 && !allowedDepts.includes(department)) {
        return res.status(403).json({ error: `Không thể chuyển khảo sát sang phòng ban bạn không quản lý.` })
      }
    }

    const updated = SurveyModel.update(req.params.id, {
      title,
      description,
      department,
      schema,
      isActive,
      isPublic,
      expiresAt
    })
    res.json({ ...updated, schema: JSON.parse(updated.schema || '{}') })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/surveys/:id - Delete survey (Manager / Admin)
router.delete('/:id', requireManagerOrAdmin, (req, res) => {
  try {
    const existing = SurveyModel.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Khảo sát không tồn tại' })

    if (!canManageSurvey(req.session.user, existing)) {
      return res.status(403).json({ error: 'Bạn không có quyền xoá khảo sát của phòng ban này.' })
    }

    SurveyModel.delete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
