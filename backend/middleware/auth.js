/**
 * Auth middleware for Express routes.
 */

export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Please log in to continue.' })
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Vui lòng đăng nhập để tiếp tục.' })
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Yêu cầu quyền Quản trị viên (Admin).' })
  }
  next()
}

export function requireManagerOrAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Vui lòng đăng nhập để tiếp tục.' })
  }
  const role = req.session.user.role
  if (role !== 'admin' && role !== 'manager') {
    return res.status(403).json({ error: 'Forbidden', message: 'Yêu cầu quyền Quản lý phòng ban hoặc Admin.' })
  }
  next()
}

/**
 * Check whether a user has authority to manage (edit, delete, view results) a specific survey.
 */
export function canManageSurvey(user, survey) {
  if (!user || !survey) return false
  if (user.role === 'admin') return true
  if (user.role !== 'manager') return false

  // Created by self
  if (survey.created_by && survey.created_by === user.id) return true

  // Department matches manager's assigned departments
  const userDepts = parseUserDepartments(user)
  if (userDepts.includes(survey.department)) return true

  return false
}

function parseUserDepartments(user) {
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
