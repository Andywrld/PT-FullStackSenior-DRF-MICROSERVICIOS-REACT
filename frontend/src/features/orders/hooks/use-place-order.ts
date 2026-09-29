import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cartKeys } from '@/features/cart/hooks/use-cart'

import { placeOrder } from '../services/orders.service'
import { orderKeys } from './use-orders'

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (idempotencyKey: string) => placeOrder(idempotencyKey),
    onSuccess: (result) => {
      queryClient.setQueryData(orderKeys.detail(result.data.id), result)
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
    // Not awaited: the caller navigates to the order while the cart refetches.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
