import { create } from 'zustand'
import api from '../lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('sf_token'),
  isLoading: true,

  setToken: (token) => {
    localStorage.setItem('sf_token', token)
    set({ token })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, isLoading: false })
    } catch {
      set({ user: null, token: null, isLoading: false })
      localStorage.removeItem('sf_token')
    }
  },

  logout: () => {
    localStorage.removeItem('sf_token')
    set({ user: null, token: null })
  }
}))