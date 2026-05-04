self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'SplitFast', {
      body:  data.body,
      icon:  data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data:  data.data || {},
      vibrate: [100, 50, 100]
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const groupId = event.notification.data?.groupId
  event.waitUntil(
    clients.openWindow(groupId ? `/group/${groupId}` : '/')
  )
})