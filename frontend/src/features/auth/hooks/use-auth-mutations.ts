import { useMutation, useQueryClient } from '@tanstack/react-query'

import { type Credentials, login, logout, type Registration, register } from '../services/auth.service'
import { useSessionStore } from '../store/session-store'

export function useLogin() {
  const startSession = useSessionStore((state) => state.startSession)
  return useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess: ({ data }) => startSession(data),
  })
}

export function useRegister() {
  const startSession = useSessionStore((state) => state.startSession)
  return useMutation({
    mutationFn: async (registration: Registration) => {
      await register(registration)
      return login({ email: registration.email, password: registration.password })
    },
    onSuccess: ({ data }) => startSession(data),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useSessionStore.getState()
      // Revoke the refresh token server-side; a failure must not keep you logged in.
      if (refreshToken) await logout(refreshToken).catch(() => undefined)
    },
    onSettled: () => {
      useSessionStore.getState().endSession()
      queryClient.clear()
    },
  })
}
