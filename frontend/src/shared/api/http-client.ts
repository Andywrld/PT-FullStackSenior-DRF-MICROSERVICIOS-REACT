import axios, { type InternalAxiosRequestConfig } from 'axios'

import { env } from '@/shared/config/env'

import { ApiError } from './api-error'
import { errorEnvelopeSchema } from './envelope'

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

export type HttpAuth = {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
  onSessionExpired: () => void
}

let auth: HttpAuth | null = null
let pendingRefresh: Promise<string | null> | null = null

export function configureHttpAuth(handlers: HttpAuth | null) {
  auth = handlers
  pendingRefresh = null
}

// Credential endpoints never trigger a renewal (that would loop).
const AUTH_ENDPOINT = /^\/auth\/(login|register|refresh|logout)\//

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

httpClient.interceptors.request.use((config) => {
  const token = auth?.getAccessToken()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** One renewal at a time: concurrent 401s all wait for the same refresh. */
function refreshOnce(handlers: HttpAuth) {
  pendingRefresh ??= handlers.refreshAccessToken().finally(() => {
    pendingRefresh = null
  })
  return pendingRefresh
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = axios.isAxiosError(error) ? (error.config as RetriableConfig | undefined) : undefined
    const unauthorized = axios.isAxiosError(error) && error.response?.status === 401
    if (auth && config && unauthorized && !config._retried && !AUTH_ENDPOINT.test(config.url ?? '')) {
      config._retried = true
      const token = await refreshOnce(auth)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        return httpClient.request(config)
      }
      auth.onSessionExpired()
    }
    return Promise.reject(toApiError(error))
  },
)

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError({ status: 0, code: 'unknown_error', message: 'Something went wrong.' })
  }
  if (!error.response) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    return new ApiError({
      status: 0,
      code: timedOut ? 'timeout' : 'network_error',
      message: timedOut ? 'The server took too long to respond.' : 'Could not reach the server.',
    })
  }
  const { status, data } = error.response
  const envelope = errorEnvelopeSchema.safeParse(data)
  if (envelope.success) {
    return ApiError.fromEnvelope(status, envelope.data)
  }
  return new ApiError({ status, code: 'unexpected_response', message: `Unexpected response (HTTP ${status}).` })
}
