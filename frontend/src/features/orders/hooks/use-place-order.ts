import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminOrderKeys, adminProductKeys } from '@/features/admin/hooks/admin-query-keys'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import { catalogKeys } from '@/features/catalog/hooks/catalog-keys'
import { isApiError } from '@/shared/api/api-error'

import { placeOrder } from '../services/orders.service'
import { orderKeys } from './use-orders'

// Refusals that mean the stock or availability shown was out of date.
const STALE_CATALOG_CODES = new Set(['insufficient_stock', 'unavailable_items'])

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (idempotencyKey: string) => placeOrder(idempotencyKey),
    onSuccess: (result) => {
      queryClient.setQueryData(orderKeys.detail(result.data.id), result)
      // The purchase took stock: the storefront (lists, detail, search) and the admin's product and order lists.
      for (const queryKey of [orderKeys.lists(), catalogKeys.all, adminProductKeys.all, adminOrderKeys.all]) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
    onError: (error) => {
      if (isApiError(error) && STALE_CATALOG_CODES.has(error.code)) {
        void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      }
    },
    // Not awaited: the caller navigates to the order while the cart refetches (also after a refusal).
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
