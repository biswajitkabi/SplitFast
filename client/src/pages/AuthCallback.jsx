import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setToken, fetchMe } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      setToken(token)
      fetchMe().then(() => navigate('/dashboard'))
    } else {
      navigate('/login')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-gray-400 mt-4 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}