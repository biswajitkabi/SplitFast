import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Login() {
  const { user, setToken, fetchMe } = useAuthStore()
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user])

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      setAuthError('Google sign-in is not configured.')
      return
    }

    const initializeGoogleSignIn = () => {
      if (!window.google || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            setAuthError('')
            const { data } = await api.post('/auth/google/token', { credential })
            setToken(data.token)
            await fetchMe()
            navigate('/dashboard')
          } catch (err) {
            setAuthError(err.response?.data?.error || 'Google sign-in failed. Please try again.')
          }
        }
      })

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'filled_blue',
        size: 'large',
        width: googleButtonRef.current.offsetWidth,
        text: 'continue_with'
      })
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      initializeGoogleSignIn()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogleSignIn
    script.onerror = () => setAuthError('Could not load Google sign-in.')
    document.body.appendChild(script)
  }, [fetchMe, navigate, setToken])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">SplitFast</h1>
          <p className="text-gray-400 mt-2 text-lg">Split expenses at the speed of UPI</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">
            Sign in to manage expenses with your groups
          </p>

          <div ref={googleButtonRef} className="min-h-11 w-full" />

          {authError && (
            <p className="text-red-400 text-sm text-center mt-4">{authError}</p>
          )}

          <p className="text-gray-600 text-xs text-center mt-6">
            By signing in, you agree to our Terms of Service
          </p>
        </div>

        <p className="text-gray-600 text-xs text-center mt-6">
          No credit card. No ads. Just split.
        </p>
      </div>
    </div>
  )
}
