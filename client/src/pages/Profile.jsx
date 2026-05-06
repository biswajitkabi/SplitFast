import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Profile() {
  const { user, fetchMe } = useAuthStore()
  const navigate          = useNavigate()
  const [upiId, setUpiId] = useState(user?.upiId || '')
  const [name, setName]   = useState(user?.name  || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [upiError, setUpiError] = useState('')

  const validateUpi = (value) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/
    if (value && !upiRegex.test(value)) {
      setUpiError('Invalid UPI ID format. Example: name@okaxis')
    } else {
      setUpiError('')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (upiError) return
    setSaving(true)
    try {
      await api.patch('/users/me', { upiId, name })
      await fetchMe()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-white font-bold text-xl">Profile</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-20 h-20 rounded-full border-2 border-violet-500 mb-3"
          />
          <p className="text-white font-semibold text-lg">{user?.name}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
        </div>

        {/* Current UPI ID display */}
        {user?.upiId ? (
          <div className="bg-gray-900 border border-emerald-800/50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs mb-1">Current UPI ID</p>
                <p className="text-emerald-400 font-medium">{user.upiId}</p>
              </div>
              <span className="text-emerald-500 text-xl">✓</span>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              You can update it below anytime
            </p>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-lg">⚠️</span>
              <p className="text-amber-400 font-medium text-sm">Set your UPI ID</p>
            </div>
            <p className="text-gray-400 text-xs">
              Without a UPI ID, your friends can't pay you directly from SplitFast.
              Set it once and forget it.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Display name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3
                         text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              UPI ID
              <span className="text-gray-600 ml-2">e.g. yourname@okicici</span>
            </label>
            <input
              value={upiId}
              onChange={e => { setUpiId(e.target.value); validateUpi(e.target.value) }}
              placeholder="yourname@okaxis"
              className={`w-full bg-gray-900 border rounded-xl px-4 py-3 text-white 
                         placeholder-gray-500 focus:outline-none transition-colors ${
                           upiError
                             ? 'border-red-500 focus:border-red-500'
                             : 'border-gray-700 focus:border-violet-500'
                         }`}
            />
            {upiError && (
              <p className="text-red-400 text-xs mt-1">{upiError}</p>
            )}
            {upiId && !upiError && (
              <p className="text-emerald-400 text-xs mt-1">✓ Valid UPI ID format</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !!upiError}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium
                       py-3 rounded-xl transition-all disabled:opacity-50 active:scale-95"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">
              {user?._count?.groupMembers || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Groups</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">⚡</p>
            <p className="text-gray-400 text-sm mt-1">SplitFast member</p>
          </div>
        </div>
      </main>
    </div>
  )
}