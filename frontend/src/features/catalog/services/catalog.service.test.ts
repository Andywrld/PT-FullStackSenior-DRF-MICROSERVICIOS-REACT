import MockAdapter from 'axios-mock-adapter'
import { afterEach, describe, expect, it } from 'vitest'

import { fetchAdminProducts } from '@/features/admin/products/services/admin-products.service'
import { httpClient } from '@/shared/api/http-client'

import { fetchProducts } from './catalog.service'

const mock = new MockAdapter(httpClient)

afterEach(() => mock.reset())

function replyWithAnEmptyList() {
  const requests: Record<string, unknown>[] = []
  mock.onGet('/products/').reply((config) => {
    requests.push(config.params)
    return [200, { success: true, data: [], error: null, meta: { request_id: 'req-1' } }]
  })
  return requests
}

describe('fetchProducts (storefront)', () => {
  it('asks only for active products that are in stock', async () => {
    const requests = replyWithAnEmptyList()

    await fetchProducts({ search: 'lavadora' })

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ is_active: true, in_stock: true, search: 'lavadora' })
  })
})

describe('fetchAdminProducts', () => {
  it('lists sold-out products too', async () => {
    const requests = replyWithAnEmptyList()

    await fetchAdminProducts({ page: 1, search: '' })

    expect(requests).toHaveLength(1)
    expect(requests[0]).not.toHaveProperty('in_stock')
  })
})
