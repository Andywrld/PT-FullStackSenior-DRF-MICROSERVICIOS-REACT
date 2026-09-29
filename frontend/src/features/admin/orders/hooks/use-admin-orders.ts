import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { adminOrderKeys } from '../../hooks/admin-query-keys'
import { type AdminOrdersQuery, fetchAdminOrders } from '../services/admin-orders.service'

export function useAdminOrders(query: AdminOrdersQuery) {
  return useQuery({
    queryKey: adminOrderKeys.list(query),
    queryFn: () => fetchAdminOrders(query),
    placeholderData: keepPreviousData,
  })
}
