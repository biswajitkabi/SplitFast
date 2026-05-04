import { create } from 'zustand'
import { io } from 'socket.io-client'
import { useGroupStore } from './groupStore'

let socket = null

export const useSocketStore = create((set, get) => ({
  connected: false,

  connect: (token) => {
    if (socket?.connected) return

    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token }
    })

    socket.on('connect', () => {
      set({ connected: true })
      console.log('Socket connected')
    })

    socket.on('disconnect', () => {
      set({ connected: false })
    })

    // Real-time: new expense added by someone else
    socket.on('expense:added', ({ expense, balances }) => {
      const { activeGroup, updateBalancesFromSocket } = useGroupStore.getState()

      // Add to expense list if in this group
      if (activeGroup?.id === expense.groupId) {
        useGroupStore.setState(state => ({
          activeGroup: {
            ...state.activeGroup,
            expenses: [expense, ...(state.activeGroup.expenses || [])]
          }
        }))
      }
      updateBalancesFromSocket(balances)
    })

    socket.on('expense:deleted', ({ expenseId, balances }) => {
      const { updateBalancesFromSocket } = useGroupStore.getState()
      useGroupStore.setState(state => ({
        activeGroup: state.activeGroup ? {
          ...state.activeGroup,
          expenses: state.activeGroup.expenses.filter(e => e.id !== expenseId)
        } : null
      }))
      updateBalancesFromSocket(balances)
    })

    socket.on('settlement:recorded', ({ settlement }) => {
      console.log('Settlement recorded:', settlement)
    })

    socket.on('member:joined', ({ user }) => {
      console.log(`${user.name} joined the group`)
    })
  },

  joinRoom: (groupId) => {
    socket?.emit('join:group', groupId)
  },

  leaveRoom: (groupId) => {
    socket?.emit('leave:group', groupId)
  },

  disconnect: () => {
    socket?.disconnect()
    socket = null
    set({ connected: false })
  }
}))