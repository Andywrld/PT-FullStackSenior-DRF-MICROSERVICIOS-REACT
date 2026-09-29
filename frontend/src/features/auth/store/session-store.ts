import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { LoginResponse, TokenPair, User } from '../model/auth'

type SessionState = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  startSession: (response: LoginResponse) => void
  updateTokens: (tokens: TokenPair) => void
  updateProfile: (user: User) => void
  endSession: () => void
}

// Only the refresh token and the profile are persisted; the access token stays in memory.
// Tradeoff: localStorage is readable by injected scripts (an httpOnly-cookie BFF would be stronger).
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      startSession: ({ access_token, refresh_token, user }) =>
        set({ accessToken: access_token, refreshToken: refresh_token, user }),
      updateTokens: ({ access_token, refresh_token }) => set({ accessToken: access_token, refreshToken: refresh_token }),
      updateProfile: (user) => set({ user }),
      endSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'marketplace-session',
      partialize: ({ refreshToken, user }) => ({ refreshToken, user }),
    },
  ),
)
