import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import { createRequire } from 'module'
import { getDb } from './db/index.js'
import { seedDatabase } from './db/seed.js'

// Routes
import authRouter from './routes/auth.js'
import surveysRouter from './routes/surveys.js'
import responsesRouter from './routes/responses.js'
import adminRouter from './routes/admin.js'
import { errorHandler } from './middleware/errorHandler.js'

const require = createRequire(import.meta.url)

const app = express()
const PORT = process.env.PORT || 3000

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Relax for dev; tighten in prod
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}))

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })) // Survey schemas can be large
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── Session (SQLite-backed for persistence) ──────────────────────────────────
const SqliteStore = require('connect-sqlite3')(session)
app.use(session({
  store: new SqliteStore({
    db: 'sessions.db',
    dir: process.env.DB_PATH ? require('path').dirname(process.env.DB_PATH) : './data',
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
}))

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize())
app.use(passport.session())

// ─── Initialize DB & Seed ──────────────────────────────────────────────────
getDb() // Runs schema on first call
seedDatabase()

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/surveys', surveysRouter)
app.use('/api/surveys/:id/response', responsesRouter)
app.use('/api/admin', adminRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'xxx.apps.googleusercontent.com') {
    console.warn('[Auth] ⚠️  Google OIDC not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env')
  }
})

export default app
