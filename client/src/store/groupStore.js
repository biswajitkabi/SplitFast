import { create } from 'zustand'
import api from '../lib/api'

export const useGroupStore = create((set, get) => ({
  groups:         [],
  activeGroup:    null,
  balances:       [],
  settlements:    [],
  isLoading:      false,

  fetchGroups: async () => {
    set({ isLoading: true })
    const { data } = await api.get('/groups')
    set({ groups: data.groups, isLoading: false })
  },

  fetchGroup: async (id) => {
    set({ isLoading: true })
    const [groupRes, balancesRes, settlementsRes] = await Promise.all([
      api.get(`/groups/${id}`),
      api.get(`/groups/${id}/balances`),
      api.get(`/groups/${id}/settlements`)
    ])
    set({
      activeGroup:  groupRes.data.group,
      balances:     balancesRes.data.balances,
      settlements:  settlementsRes.data.settlements,
      isLoading:    false
    })
  },

  createGroup: async ({ name, description, emoji }) => {
    const { data } = await api.post('/groups', { name, description, emoji })
    set(state => ({ groups: [data.group, ...state.groups] }))
    return data.group
  },

  joinGroup: async (inviteCode) => {
    const { data } = await api.post(`/groups/join/${inviteCode}`)
    await get().fetchGroups()
    return data.group
  },

  addExpense: async (payload) => {
    const { data } = await api.post('/expenses', payload)
    // Real-time will update balances via socket
    // Optimistically add expense to active group
    set(state => ({
      activeGroup: state.activeGroup ? {
        ...state.activeGroup,
        expenses: [data.expense, ...(state.activeGroup.expenses || [])]
      } : null
    }))
    return data.expense
  },

  deleteExpense: async (expenseId) => {
    await api.delete(`/expenses/${expenseId}`)
    set(state => ({
      activeGroup: state.activeGroup ? {
        ...state.activeGroup,
        expenses: state.activeGroup.expenses.filter(e => e.id !== expenseId)
      } : null
    }))
  },

  // Called by socket events to sync real-time balance updates
  updateBalancesFromSocket: (balances) => {
    set({ balances })
  }
}))