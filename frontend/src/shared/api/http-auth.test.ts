import MockAdapter from 'axios-mock-adapter'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureHttpAuth, httpClient } from './http-client'

const mock = new MockAdapter(httpClient)
const ok = { success: true, data: { ok: true }, error: null, meta: { request_id: 'r' } }
const expired = { success: false, data: null, error: { code: 'token_expired', message: 'x', details: null }, meta: { request_id: 'r' } }

afterEach(() => {
  mock.reset()
  configureHttpAuth(null)
})

describe('http client authentication', () => {
  it('renews an expired token once for concurrent requests, then retries them', async () => {
    let token = 'expired-token'
    const refresh = vi.fn(async () => {
      token = 'fresh-token'
      return token
    })
    configureHttpAuth({ getAccessToken: () => token, refreshAccessToken: refresh, onSessionExpired: vi.fn() })
    mock.onGet('/cart/').reply((config) =>
      config.headers?.Authorization === 'Bearer fresh-token' ? [200, ok] : [401, expired],
    )

    const responses = await Promise.all([httpClient.get('/cart/'), httpClient.get('/cart/')])

    expect(responses.map((response) => response.status)).toEqual([200, 200])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('ends the session when the token cannot be renewed', async () => {
    const onSessionExpired = vi.fn()
    configureHttpAuth({ getAccessToken: () => 'expired-token', refreshAccessToken: async () => null, onSessionExpired })
    mock.onGet('/cart/').reply(401, expired)

    const error = await httpClient.get('/cart/').catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 401, code: 'token_expired' })
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })
})
