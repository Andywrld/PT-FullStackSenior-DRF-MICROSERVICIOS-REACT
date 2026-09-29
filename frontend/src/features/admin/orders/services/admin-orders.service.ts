import { z } from 'zod'

import { orderSchema } from '@/features/orders/model/order'
import { apiGet } from '@/shared/api/api'

import { type OrderPeriod, periodStart } from '../model/order-period'

export const ADMIN_ORDERS_PAGE_SIZE = 20

export type AdminOrdersQuery = {
  page: number
  search: string
  period?: OrderPeriod
  ordering?: string
}

export function fetchAdminOrders({ page, search, period, ordering }: AdminOrdersQuery) {
  return apiGet('/orders/', z.array(orderSchema), {
    page,
    page_size: ADMIN_ORDERS_PAGE_SIZE,
    search: search || undefined,
    created_after: period ? periodStart(period, new Date()).toISOString() : undefined,
    ordering,
  })
}
