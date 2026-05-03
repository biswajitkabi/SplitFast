import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import groupRoutes from './routes/groups.routes.js'
import expenseRoutes from './routes/expenses.routes.js'
import userRoutes from './routes/users.routes.js'
import { authMiddleware } from './middleware/auth.middleware.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Public
app.use('/api/auth', authRoutes)

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
