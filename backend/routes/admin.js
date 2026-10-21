import express from 'express'
import { ResponseModel } from '../models/response.js'
import { UserModel } from '../models/user.js'
import { DepartmentModel } from '../models/department.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/admin/departments - System department list
router.get('/departments', (req, res) => {
  try {
    const departments = DepartmentModel.list()
    res.json({ departments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/departments - Create new department (Admin only)
router.post('/departments', requireAdmin, (req, res) => {
  try {
    const { name } = req.body
    const created = DepartmentModel.create(name)
    res.status(201).json({ success: true, name: created, departments: DepartmentModel.list() })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/admin/departments/:name - Rename department (Admin only)
router.put('/departments/:name', requireAdmin, (req, res) => {
  try {
    const { newName } = req.body
    const updated = DepartmentModel.update(req.params.name, newName)
    res.json({ success: true, name: updated, departments: DepartmentModel.list() })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/admin/departments/:name - Delete department (Admin only)
router.delete('/departments/:name', requireAdmin, (req, res) => {
  try {
    DepartmentModel.delete(req.params.name)
    res.json({ success: true, departments: DepartmentModel.list() })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/admin/stats - Global dashboard stats
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const stats = ResponseModel.getGlobalStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/users - User list with department assignments
router.get('/users', requireAdmin, (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query
    const rawUsers = UserModel.list({ limit: +limit, offset: +offset })
    const total = UserModel.count()

    const users = rawUsers.map(u => {
      let depts = []
      if (u.departments) {
        try { depts = JSON.parse(u.departments) } catch { depts = u.departments.split(',').map(d => d.trim()).filter(Boolean) }
      } else if (u.department) {
        depts = [u.department]
      }
      return {
        ...u,
        departmentsList: depts,
      }
    })

    res.json({ users, total, availableDepartments: DepartmentModel.list() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/users/:id/role - Change user role & assigned departments
router.put('/users/:id/role', requireAdmin, (req, res) => {
  try {
    const { role, departments, department } = req.body
    if (!['user', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ. Phải là user, manager hoặc admin.' })
    }

    const deptsStr = Array.isArray(departments) ? JSON.stringify(departments) : (departments || '')
    const primaryDept = department || (Array.isArray(departments) && departments.length > 0 ? departments[0] : '')

    UserModel.updateRole(req.params.id, role, deptsStr, primaryDept)
    const updated = UserModel.findById(req.params.id)
    res.json({ success: true, user: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
