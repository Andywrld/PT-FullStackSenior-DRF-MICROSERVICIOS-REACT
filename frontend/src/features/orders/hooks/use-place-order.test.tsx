import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminOrderKeys, adminProductKeys } from '@/features/admin/hooks/admin-query-keys'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import { catalogKeys } from '@/features/catalog/hooks/catalog-keys'
import { ApiError } from '@/shared/api/api-error'

import type { Order } from '../model/order'
import { placeOrder } from '../services/orders.service'
import { orderKeys } from './use-orders'
import { usePlaceOrder } from './use-place-order'

vi.mock('../services/orders.service')

const order: Order = {
  id: crypto.randomUUID(),
  user_id: crypto.randomUUID(),
  customer_email: 'ana@example.com',
  status: 'placed',
  subtotal: '19.99',
  total_quantity: 1,
  items: [],
  created_at: '2026-09-29T00:00:00Z',
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => usePlaceOrder(), { wrapper })
  const submit = () => act(() => result.current.mutateAsync('checkout-key').catch(() => undefined))
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey)
  return { queryClient, submit, invalidatedKeys }
}

const apiError = (code: string, status = 400) => new ApiError({ status, code, message: code })

describe('usePlaceOrder', () => {
  beforeEach(() => {
    vi.mocked(placeOrder).mockReset()
  })

  it('refreshes everything the purchase changed: stock in the storefront and the admin, the cart and the orders', async () => {
    vi.mocked(placeOrder).mockResolvedValue({ data: order, meta: { request_id: 'req-1' } })
    const { queryClient, submit, invalidatedKeys } = setup()

    await submit()

    expect(queryClient.getQueryData(orderKeys.detail(order.id))).toMatchObject({ data: order })
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        orderKeys.lists(),
        catalogKeys.all,
        adminProductKeys.all,
        adminOrderKeys.all,
        cartKeys.all,
      ]),
    )
  })

  it.each(['insufficient_stock', 'unavailable_items'])(
    'refetches the catalog and the cart when the order is refused with %s, and leaves the rest alone',
    async (code) => {
      vi.mocked(placeOrder).mockRejectedValue(apiError(code, 409))
      const { submit, invalidatedKeys } = setup()

      await submit()

      expect(invalidatedKeys()).toEqual(expect.arrayContaining([catalogKeys.all, cartKeys.all]))
      expect(invalidatedKeys()).not.toContainEqual(orderKeys.lists())
      expect(invalidatedKeys()).not.toContainEqual(adminProductKeys.all)
    },
  )

  it('only refetches the cart for any other failure, since the catalog did not change', async () => {
    vi.mocked(placeOrder).mockRejectedValue(apiError('service_unavailable', 503))
    const { submit, invalidatedKeys } = setup()

    await submit()

    expect(invalidatedKeys()).toEqual([cartKeys.all])
  })
})
