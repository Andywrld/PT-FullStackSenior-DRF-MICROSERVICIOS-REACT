import MockAdapter from 'axios-mock-adapter'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { apiGet } from './api'
import { ApiError } from './api-error'
import { httpClient } from './http-client'

const mock = new MockAdapter(httpClient)
const meta = { request_id: 'req-1' }

afterEach(() => mock.reset())

describe('apiGet', () => {
  it('returns the validated data and meta of a success envelope', async () => {
    mock.onGet('/products/1/').reply(200, { success: true, data: { name: 'Mouse' }, error: null, meta })

    const result = await apiGet('/products/1/', z.object({ name: z.string() }))

    expect(result).toEqual({ data: { name: 'Mouse' }, meta })
  })

  it('throws an ApiError carrying the backend error code and details', async () => {
    mock.onGet('/products/').reply(400, {
      success: false,
      data: null,
      error: { code: 'validation_error', message: 'Invalid input.', details: { price: ['Too low.'] } },
      meta,
    })

    const error = await apiGet('/products/', z.unknown()).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'validation_error', details: { price: ['Too low.'] } })
  })

  it('rejects a success response that breaks the contract instead of passing bad data on', async () => {
    mock.onGet('/products/1/').reply(200, { success: true, data: { name: 42 }, error: null, meta })

    const error = await apiGet('/products/1/', z.object({ name: z.string() })).catch((e: unknown) => e)

    expect(error).toMatchObject({ code: 'invalid_response' })
  })

  it('turns a network failure into an ApiError', async () => {
    mock.onGet('/products/').networkError()

    const error = await apiGet('/products/', z.unknown()).catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 0, code: 'network_error' })
  })
})
