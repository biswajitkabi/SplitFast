import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import groupRoutes from './routes/groups.routes.js'
import expenseRoutes from './routes/expenses.routes.js'
import userRoutes from './routes/users.routes.js'
import { authMiddleware } from './middleware/auth.middleware.js'
import prisma from './lib/prisma.js'
import pushRoutes from './routes/push.routes.js'

const app = express()
app.set('trust proxy', 1)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
  credentials: true
}))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true })
  } catch (err) {
    const isAuthError = err?.code === 'P1000' ||
      err?.message?.includes('Authentication failed against database server')
    res.status(503).json({
      ok: false,
      error: isAuthError
        ? 'Database authentication failed. Check DATABASE_URL in server/.env.'
        : 'Database connection failed.'
    })
  }
})

// Public
app.use('/api/auth', authRoutes)
app.use('/api/push', pushRoutes)

// Protected
app.use('/api/groups',   authMiddleware, groupRoutes)
app.use('/api/expenses', authMiddleware, expenseRoutes)
app.use('/api/users',    authMiddleware, userRoutes)

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

export default app
