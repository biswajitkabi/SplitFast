import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()
const prisma = new PrismaClient()

// Save push subscription
router.post('/subscribe', authMiddleware, async (req, res) => {
  const { endpoint, keys } = req.body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription' })
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id }
  })

  res.json({ success: true })
})

// Remove push subscription
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  const { endpoint } = req.body
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  res.json({ success: true })
})

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

export default router