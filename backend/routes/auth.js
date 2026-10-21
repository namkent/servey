import express from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oidc'
import OpenIDConnectStrategy from 'passport-openidconnect'
import { googleConfig, sdvConfig, normalizeProfile } from '../config/oidc.js'
import { UserModel } from '../models/user.js'

const router = express.Router()

// ─── Passport: Google OIDC ───────────────────────────────────────────────────
passport.use('google', new GoogleStrategy(
  {
    clientID: googleConfig.clientId,
    clientSecret: googleConfig.clientSecret,
    callbackURL: googleConfig.callbackURL,
    scope: googleConfig.scope,
    prompt: 'select_account',
  },
  async (issuer, profile, done) => {
    try {
      const normalized = normalizeProfile(profile, 'google')
      const user = UserModel.create(normalized)
      done(null, user)
    } catch (err) {
      done(err)
    }
  }
))

// ─── Passport: SDV OIDC (lazy init because domain may not be set) ────────────
let sdvStrategyInitialized = false

function initSdvStrategy() {
  if (sdvStrategyInitialized || !sdvConfig.domain || !sdvConfig.clientId) return

  try {
    passport.use('sdv', new OpenIDConnectStrategy(
      {
        issuer: sdvConfig.issuer,
        authorizationURL: sdvConfig.authorizationURL,
        tokenURL: sdvConfig.tokenURL,
        userInfoURL: sdvConfig.userInfoURL,
        clientID: sdvConfig.clientId,
        clientSecret: sdvConfig.clientSecret,
        callbackURL: sdvConfig.callbackURL,
        scope: ['email', 'profile'],
        prompt: 'select_account',
      },
      async (issuer, profile, done) => {
        try {
          const normalized = normalizeProfile(profile, 'sdv')
          const user = UserModel.create(normalized)
          done(null, user)
        } catch (err) {
          done(err)
        }
      }
    ))

    sdvStrategyInitialized = true
    console.log('[Auth] SDV OIDC strategy initialized')
  } catch (err) {
    console.error('[Auth] Failed to init SDV strategy:', err.message)
  }
}

// Serialize/deserialize for session
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
  try {
    const user = UserModel.findById(id)
    done(null, user || false)
  } catch (err) {
    done(err)
  }
})

// ─── Feature Flags & Auth Config ─────────────────────────────────────────────
export function getAuthConfig() {
  const isProd = process.env.NODE_ENV === 'production'

  // Demo mode: explicit flag takes precedence; otherwise active only when not in production
  let demo = !isProd
  if (process.env.ENABLE_DEMO_LOGIN !== undefined) {
    demo = String(process.env.ENABLE_DEMO_LOGIN).trim().toLowerCase() === 'true'
  }

  // Google OIDC: explicitly controlled via ENABLE_GOOGLE_AUTH (default true)
  const google = process.env.ENABLE_GOOGLE_AUTH !== undefined
    ? String(process.env.ENABLE_GOOGLE_AUTH).trim().toLowerCase() === 'true'
    : true

  // SDV OIDC: explicitly controlled via ENABLE_SDV_AUTH (default true)
  const sdv = process.env.ENABLE_SDV_AUTH !== undefined
    ? String(process.env.ENABLE_SDV_AUTH).trim().toLowerCase() === 'true'
    : true

  const sdvName = sdvConfig.providerName || 'SDV SSO'

  return { google, sdv, demo, sdvName }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Public configuration for login UI
router.get('/config', (req, res) => {
  res.json(getAuthConfig())
})

// Google login
router.get('/google', (req, res, next) => {
  const config = getAuthConfig()
  if (!config.google) {
    return res.status(403).json({ error: 'Đăng nhập Google đã bị tắt trong hệ thống.' })
  }
  const prompt = req.query.prompt || 'select_account'
  passport.authenticate('google', { scope: googleConfig.scope, prompt })(req, res, next)
})

router.get('/google/callback',
  (req, res, next) => {
    const config = getAuthConfig()
    if (!config.google) {
      return res.redirect(`${process.env.FRONTEND_URL}/survey/login?error=provider_disabled`)
    }
    next()
  },
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/survey/login?error=google_failed` }),
  (req, res) => {
    req.session.user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      provider: req.user.provider,
    }
    const redirect = req.session.returnTo || `${process.env.FRONTEND_URL}/survey`
    delete req.session.returnTo
    res.redirect(redirect)
  }
)

// SDV login
router.get('/sdv', async (req, res, next) => {
  const config = getAuthConfig()
  if (!config.sdv) {
    return res.status(403).json({ error: 'Đăng nhập SDV SSO đã bị tắt trong hệ thống.' })
  }
  await initSdvStrategy()
  if (!sdvStrategyInitialized) {
    return res.redirect(`${process.env.FRONTEND_URL}/survey/login?error=sdv_not_configured`)
  }
  const prompt = req.query.prompt || 'select_account'
  passport.authenticate('sdv', { prompt })(req, res, next)
})

router.get('/sdv/callback', async (req, res, next) => {
  const config = getAuthConfig()
  if (!config.sdv) {
    return res.redirect(`${process.env.FRONTEND_URL}/survey/login?error=provider_disabled`)
  }
  await initSdvStrategy()
  passport.authenticate('sdv', { failureRedirect: `${process.env.FRONTEND_URL}/survey/login?error=sdv_failed` })(req, res, (err) => {
    if (err) return next(err)
    req.session.user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      provider: req.user.provider,
    }
    const redirect = req.session.returnTo || `${process.env.FRONTEND_URL}/survey`
    delete req.session.returnTo
    res.redirect(redirect)
  })
})

// Current user
router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ authenticated: false, user: null })
  }
  // Always refresh from DB to get latest role and departments
  const dbUser = UserModel.findById(req.session.user.id)
  if (!dbUser) {
    req.session.destroy()
    return res.status(401).json({ authenticated: false, user: null })
  }
  // Sync session role and departments
  req.session.user.role = dbUser.role
  req.session.user.department = dbUser.department || ''
  req.session.user.departments = dbUser.departments || ''
  res.json({ authenticated: true, user: req.session.user })
})

// Dev login (convenient for local development & testing)
router.post('/dev-login', (req, res) => {
  const config = getAuthConfig()
  if (!config.demo) {
    return res.status(403).json({ error: 'Chế độ trải nghiệm nhanh (demo) bị vô hiệu hoá trên môi trường này.' })
  }

  const { role = 'admin', email: reqEmail, name: reqName, department: reqDept } = req.body

  let finalRole = role
  let finalDept = reqDept || ''
  let finalDepts = finalDept ? JSON.stringify([finalDept]) : ''
  let email = reqEmail
  let name = reqName

  if (role === 'manager-it') {
    finalRole = 'manager'
    finalDept = 'IT'
    finalDepts = JSON.stringify(['IT'])
    email = email || 'nguyen.van.a@company.com'
    name = name || 'Nguyễn Văn A (IT)'
  } else if (role === 'manager-hr') {
    finalRole = 'manager'
    finalDept = 'HR'
    finalDepts = JSON.stringify(['HR'])
    email = email || 'nguyen.thi.b@company.com'
    name = name || 'Nguyễn Thị B (HR)'
  } else if (role === 'admin') {
    finalRole = 'admin'
    email = email || 'admin@survey.local'
    name = name || 'Quản trị viên Hệ thống'
  } else {
    finalRole = 'user'
    email = email || 'user@survey.local'
    name = name || 'Người dùng Demo'
  }

  const id = `dev_${role}_${Date.now()}`
  let user = UserModel.findByEmail(email)
  if (!user) {
    user = UserModel.create({
      id,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      provider: 'dev',
      role: finalRole,
      department: finalDept,
      departments: finalDepts,
    })
    if (user.role !== finalRole || user.departments !== finalDepts) {
      UserModel.updateRole(user.id, finalRole, finalDepts, finalDept)
      user.role = finalRole
      user.department = finalDept
      user.departments = finalDepts
    }
  } else {
    if (user.role !== finalRole || user.departments !== finalDepts) {
      UserModel.updateRole(user.id, finalRole, finalDepts, finalDept)
      user.role = finalRole
      user.department = finalDept
      user.departments = finalDepts
    }
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    department: user.department || '',
    departments: user.departments || '',
    provider: user.provider,
  }
  res.json({ success: true, user: req.session.user })
})

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('[Auth] Logout error:', err)
    res.clearCookie('connect.sid')
    res.json({ success: true })
  })
})

export default router
export { initSdvStrategy }
