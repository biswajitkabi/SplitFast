import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('error', (err) => console.error('Redis error:', err))

const FEED_MAX = 50 // keep last 50 events per group

/**
 * Push an activity event to a group's feed
 */
export async function pushActivity(groupId, event) {
  const key     = `feed:${groupId}`
  const payload = JSON.stringify({ ...event, ts: Date.now() })

  await redis.lpush(key, payload)
  await redis.ltrim(key, 0, FEED_MAX - 1)  // keep only latest 50
  await redis.expire(key, 60 * 60 * 24 * 30) // expire after 30 days
}

/**
 * Get recent activity for a group
 */
export async function getActivity(groupId, limit = 20) {
  const key  = `feed:${groupId}`
  const raw  = await redis.lrange(key, 0, limit - 1)
  return raw.map(item => JSON.parse(item))
}

export default redis