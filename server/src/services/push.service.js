import webpush from 'web-push'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export async function sendPushToGroup(groupId, payload, excludeUserId) {
  // Get all members of the group except the one who triggered the event
  const members = await prisma.groupMember.findMany({
    where: { groupId, NOT: { userId: excludeUserId } }
  })

  const userIds = members.map(m => m.userId)

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } }
  })

  const notification = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    icon:  '/icon-192.png',
    data:  payload.data || {}
  })

  // Send to all subscriptions, remove stale ones
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification
        )
      } catch (err) {
        // Subscription expired — clean it up
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      }
    })
  )
}