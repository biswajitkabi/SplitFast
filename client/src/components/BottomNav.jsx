import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/profile',   icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Don't show on login/callback
  if (['/login', '/auth/callback'].includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800
                    flex items-center justify-around px-4 py-2 z-50
                    safe-area-inset-bottom">
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              active ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-xs font-medium ${
              active ? 'text-violet-400' : 'text-gray-400'
            }`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}