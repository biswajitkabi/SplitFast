import { useEffect } from 'react'
import api from '../lib/api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export function usePush() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const { data } = await api.get('/push/vapid-key')
        const applicationServerKey = urlBase64ToUint8Array(data.publicKey)

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        })

        await api.post('/push/subscribe', subscription)
        console.log('Push notifications enabled')
      } catch (err) {
        console.error('Push setup failed:', err)
      }
    }

    register()
  }, [])
}