import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function ActivityFeed({ groupId }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    api.get(`/groups/${groupId}/activity`)
      .then(({ data }) => setEvents(data.events))
      .catch(() => {})
  }, [groupId])

  if (events.length === 0) return null

  return (
    <div className="mt-4">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">
        Activity
      </p>
      <div className="space-y-2">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-3">
            <img
              src={event.actor?.avatar}
              alt={event.actor?.name}
              className="w-6 h-6 rounded-full border border-gray-700 flex-shrink-0"
            />
            <p className="text-gray-400 text-sm">
              <span className="text-white">{event.actor?.name}</span>{' '}
              {event.text}
            </p>
            <span className="text-gray-600 text-xs ml-auto flex-shrink-0">
              {timeAgo(event.ts)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}