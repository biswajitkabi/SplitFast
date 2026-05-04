import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGroupStore } from '../store/groupStore'
import { useSocketStore } from '../store/socketStore'
import { usePush } from '../hooks/usePush'

export default function Dashboard() {
  const { user, logout }              = useAuthStore()
  const { groups, fetchGroups, createGroup, joinGroup, isLoading } = useGroupStore()
  const { connect }                   = useSocketStore()
  const navigate                      = useNavigate()
  const [showCreate, setShowCreate]   = useState(false)
  const [showJoin, setShowJoin]       = useState(false)
  const [groupName, setGroupName]     = useState('')
  const [groupEmoji, setGroupEmoji]   = useState('💸')
  const [inviteCode, setInviteCode]   = useState('')
  const [creating, setCreating]       = useState(false)

  usePush()

  useEffect(() => {
    fetchGroups()
    connect(localStorage.getItem('sf_token'))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) return
    setCreating(true)
    try {
      const group = await createGroup({ name: groupName, emoji: groupEmoji })
      navigate(`/group/${group.id}`)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    try {
      const group = await joinGroup(inviteCode.trim())
      navigate(`/group/${group.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid invite code')
    }
  }

  const emojis = ['💸', '🍕', '✈️', '🏠', '🎉', '🛒', '⚡', '🎮']

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-white font-bold text-xl">SplitFast</span>
        </div>
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-8 h-8 rounded-full border border-gray-700"
          />
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {groups.length === 0
              ? 'Create a group to start splitting'
              : `You're in ${groups.length} group${groups.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false) }}
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium 
                       py-3 px-4 rounded-xl transition-all active:scale-95"
          >
            + New group
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false) }}
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium 
                       py-3 px-4 rounded-xl transition-all active:scale-95 border border-gray-700"
          >
            Join group
          </button>
        </div>

        {/* Create group form */}
        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
            <h2 className="text-white font-semibold mb-4">Create a group</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Pick an emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setGroupEmoji(e)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        groupEmoji === e
                          ? 'bg-violet-600'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Group name</label>
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Goa trip, Flat 4B, Office lunch..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                             text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-medium 
                             py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create group'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join group form */}
        {showJoin && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
            <h2 className="text-white font-semibold mb-4">Join a group</h2>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Paste invite code..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                           text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-medium 
                             py-3 rounded-xl transition-all"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoin(false)}
                  className="px-4 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Groups list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-900 rounded-2xl h-20 animate-pulse"/>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">💸</div>
            <p className="text-gray-400">No groups yet. Create one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700
                           rounded-2xl p-4 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{group.emoji}</span>
                    <div>
                      <p className="text-white font-medium">{group.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {group.members.length} member{group.members.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <BalancePill amount={group.myBalance} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function BalancePill({ amount }) {
  if (Math.abs(amount) < 0.01) {
    return <span className="text-gray-500 text-sm">settled up</span>
  }
  if (amount > 0) {
    return (
      <span className="text-emerald-400 text-sm font-medium">
        +₹{amount.toFixed(2)}
      </span>
    )
  }
  return (
    <span className="text-red-400 text-sm font-medium">
      -₹{Math.abs(amount).toFixed(2)}
    </span>
  )
}