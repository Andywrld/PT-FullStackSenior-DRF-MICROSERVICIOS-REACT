import { z } from 'zod'

import { apiGet, apiPost } from '@/shared/api/api'

import { loginResponseSchema, tokenPairSchema, userSchema } from '../model/auth'

export type Credentials = { email: string; password: string }
export type Registration = Credentials & { full_name: string }

export function login(credentials: Credentials) {
  return apiPost('/auth/login/', loginResponseSchema, credentials)
}

export function register(registration: Registration) {
  return apiPost('/auth/register/', userSchema, registration)
}

export function refreshSession(refreshToken: string) {
  return apiPost('/auth/refresh/', tokenPairSchema, { refresh_token: refreshToken })
}

export function logout(refreshToken: string) {
  return apiPost('/auth/logout/', z.null(), { refresh_token: refreshToken })
}

export function fetchCurrentUser() {
  return apiGet('/auth/me/', userSchema)
}
