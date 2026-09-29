import { refreshSession } from '@/features/auth/services/auth.service'
import { useSessionStore } from '@/features/auth/store/session-store'
import { configureHttpAuth } from '@/shared/api/http-client'

import { queryClient } from './query-client'

export function setupHttpAuth() {
  configureHttpAuth({
    getAccessToken: () => useSessionStore.getState().accessToken,
    refreshAccessToken: async () => {
      const { refreshToken, updateTokens } = useSessionStore.getState()
      if (!refreshToken) return null
      try {
        const { data } = await refreshSession(refreshToken)
        updateTokens(data)
        return data.access_token
      } catch {
        return null
      }
    },
    onSessionExpired: () => {
      useSessionStore.getState().endSession()
      // Private data (cart, orders) must not outlive the session.
      queryClient.clear()
    },
  })
}
