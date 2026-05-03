import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { fetchMe, token } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
    else useAuthStore.setState({ isLoading: false })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/auth/callback"  element={<AuthCallback />} />
        <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/"               element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}