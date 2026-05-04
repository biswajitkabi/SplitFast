import { Router } from 'express'
import passport from '../config/passport.js'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import prisma from '../lib/prisma.js'

const router = Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const createAuthToken = (user) => jwt.sign(
  { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

const sendDatabaseAuthError = (res, err) => {
  if (err?.code === 'P1000' || err?.message?.includes('Authentication failed against database server')) {
    return res.status(503).json({
      error: 'Database authentication failed. Check DATABASE_URL in server/.env.'
    })
  }

  return null
}

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = createAuthToken(req.user)
    // Redirect to frontend with token in query — FE grabs it and stores in memory
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
  }
)

router.post('/google/token', async (req, res, next) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' })
    }

    let ticket
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      })
    } catch {
      return res.status(401).json({ error: 'Invalid Google credential' })
    }
    const payload = ticket.getPayload()

    if (!payload?.sub || !payload?.email || payload.email_verified === false) {
      return res.status(401).json({ error: 'Invalid Google account' })
    }

    let user
    try {
      user = await prisma.user.findUnique({
        where: { googleId: payload.sub }
      })

      if (!user) {
        const existingUser = await prisma.user.findUnique({
          where: { email: payload.email }
        })

        if (existingUser) {
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: payload.sub,
              name: payload.name || existingUser.name,
              avatar: payload.picture || existingUser.avatar
            }
          })
        } else {
          user = await prisma.user.create({
            data: {
              googleId: payload.sub,
              email: payload.email,
              name: payload.name || payload.email,
              avatar: payload.picture
            }
          })
        }
      }
    } catch (err) {
      if (sendDatabaseAuthError(res, err)) return
      throw err
    }

    res.json({ token: createAuthToken(user) })
  } catch (err) {
    next(err)
  }
})

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
