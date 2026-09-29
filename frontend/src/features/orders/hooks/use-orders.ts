import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/use-session'

import { fetchMyOrders, fetchOrder } from '../services/orders.service'

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (page: number) => [...orderKeys.lists(), { page }] as const,
  detail: (orderId: string) => [...orderKeys.all, 'detail', orderId] as const,
}

export function useMyOrders(page: number) {
  const userId = useSession().user?.id
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: userId ? () => fetchMyOrders(userId, page) : skipToken,
    placeholderData: keepPreviousData,
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrder(orderId),
  })
}
