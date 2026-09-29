import { z } from 'zod'

import { apiGet, apiPost } from '@/shared/api/api'

import { orderSchema } from '../model/order'

export const ORDERS_PAGE_SIZE = 10

export function placeOrder(idempotencyKey: string) {
  return apiPost('/orders/', orderSchema, undefined, { headers: { 'Idempotency-Key': idempotencyKey } })
}

// Admins see every order by default; `user_id` narrows the list to their own.
export function fetchMyOrders(userId: string, page: number) {
  return apiGet('/orders/', z.array(orderSchema), { user_id: userId, page, page_size: ORDERS_PAGE_SIZE })
}

export function fetchOrder(orderId: string) {
  return apiGet(`/orders/${orderId}/`, orderSchema)
}
