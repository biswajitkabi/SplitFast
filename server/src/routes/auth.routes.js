import { Router } from 'express'
import passport from '../config/passport.js'
import jwt from 'jsonwebtoken'

const router = Router()

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, name: req.user.name, avatar: req.user.avatar },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    // Redirect to frontend with token in query — FE grabs it and stores in memory
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
  }
)

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