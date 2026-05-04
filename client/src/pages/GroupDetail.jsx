import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGroupStore } from '../store/groupStore'
import { useSocketStore } from '../store/socketStore'
import { useAuthStore } from '../store/authStore'
import AddExpense from './AddExpense'
import { buildUpiLink, isMobile } from '../lib/upi'
import ActivityFeed from '../components/ActivityFeed'

export default function GroupDetail() {
  const { id }                      = useParams()
  const navigate                    = useNavigate()
  const { user }                    = useAuthStore()
  const { joinRoom, leaveRoom }     = useSocketStore()
  const {
    activeGroup, balances, settlements,
    fetchGroup, deleteExpense, isLoading
  } = useGroupStore()

  const [tab, setTab]               = useState('expenses') // 'expenses' | 'balances' | 'settle'
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [copied, setCopied]         = useState(false)

  useEffect(() => {
    fetchGroup(id)
    joinRoom(id)
    return () => leaveRoom(id)
  }, [id])

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(activeGroup.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading || !activeGroup) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <span className="text-2xl">{activeGroup.emoji}</span>
          <h1 className="text-white font-bold text-xl flex-1">{activeGroup.name}</h1>
          <button
            onClick={handleCopyInvite}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 
                       px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? '✓ Copied!' : 'Invite'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl">
          {['expenses', 'balances', 'settle'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                tab === t
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Expenses tab */}
        {tab === 'expenses' && (
          <div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium
                         py-3 rounded-xl mb-4 transition-all active:scale-95"
            >
              + Add expense
            </button>

            {showAddExpense && (
              <AddExpense
                group={activeGroup}
                onClose={() => setShowAddExpense(false)}
              />
            )}

            <div className="space-y-3">
              {activeGroup.expenses?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No expenses yet. Add one!</p>
                </div>
              )}
              {activeGroup.expenses?.map(expense => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentUserId={user.id}
                  onDelete={() => deleteExpense(expense.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Balances tab */}
        {tab === 'balances' && (
          <div className="space-y-3">
            {balances.map(b => (
              <div
                key={b.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 
                           flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatar}
                    alt={b.name}
                    className="w-9 h-9 rounded-full border border-gray-700"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{b.name}</p>
                    <p className="text-gray-500 text-xs">
                      {b.balance > 0 ? 'gets back' : b.balance < 0 ? 'owes' : 'settled'}
                    </p>
                  </div>
                </div>
                <BalancePill amount={b.balance} />
              </div>
            ))}
          </div>
        )}

        {/* Settle tab */}
        {tab === 'settle' && (
          <div className="space-y-3">
            {settlements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-white font-medium">All settled up!</p>
                <p className="text-gray-500 text-sm mt-1">No outstanding debts</p>
              </div>
            ) : (
              settlements.map((s, i) => (
                <SettlementCard key={i} settlement={s} currentUserId={user.id} groupId={id} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ExpenseCard({ expense, currentUserId, onDelete }) {
  const isPayer = expense.paidById === currentUserId
  const myShare = expense.splits?.find(s => s.userId === currentUserId)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-white font-medium">{expense.description}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            Paid by {isPayer ? 'you' : expense.paidBy?.name} •{' '}
            {new Date(expense.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short'
            })}
          </p>
        </div>
        <div className="text-right ml-4">
          <p className="text-white font-semibold">₹{expense.amount.toFixed(2)}</p>
          {myShare && (
            <p className={`text-xs mt-0.5 ${isPayer ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPayer ? `you get back ₹${(expense.amount - myShare.amount).toFixed(2)}` : `your share ₹${myShare.amount.toFixed(2)}`}
            </p>
          )}
        </div>
      </div>
      {isPayer && (
        <button
          onClick={onDelete}
          className="mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  )
}

function SettlementCard({ settlement, currentUserId, groupId }) {
  const isDebtor = settlement.from?.id === currentUserId
  const mobile   = isMobile()

  const handleUpiPay = () => {
    if (!settlement.to?.upiId) {
      alert(`${settlement.to?.name} hasn't set their UPI ID yet`)
      return
    }
    const link = buildUpiLink({
      upiId:  settlement.to.upiId,
      name:   settlement.to.name,
      amount: settlement.amount,
      note:   'SplitFast settlement'
    })
    window.location.href = link
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm">
            <span className={isDebtor ? 'text-red-400 font-medium' : 'text-white'}>
              {isDebtor ? 'You' : settlement.from?.name}
            </span>
            <span className="text-gray-500"> owe </span>
            <span className={!isDebtor ? 'text-emerald-400 font-medium' : 'text-white'}>
              {!isDebtor ? 'you' : settlement.to?.name}
            </span>
          </p>
          <p className="text-white font-bold text-lg mt-0.5">
            ₹{settlement.amount.toFixed(2)}
          </p>
        </div>

        {isDebtor && (
          <button
            onClick={handleUpiPay}
            disabled={!mobile}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40
                       disabled:cursor-not-allowed text-white text-sm font-medium
                       px-4 py-2 rounded-xl transition-all active:scale-95"
            title={!mobile ? 'UPI payments work on mobile only' : ''}
          >
            Pay via UPI
          </button>
        )}
      </div>
      {isDebtor && !mobile && (
        <p className="text-gray-600 text-xs mt-2">
          Open on your phone to pay via GPay / PhonePe
        </p>
      )}
    </div>
  )
}

function BalancePill({ amount }) {
  if (Math.abs(amount) < 0.01) return <span className="text-gray-500 text-sm">settled</span>
  if (amount > 0) return <span className="text-emerald-400 font-semibold">+₹{amount.toFixed(2)}</span>
  return <span className="text-red-400 font-semibold">-₹{Math.abs(amount).toFixed(2)}</span>
}