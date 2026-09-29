import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ApiResult } from '@/shared/api/api'
import { isApiError } from '@/shared/api/api-error'

import { type Cart, withoutLine } from '../model/cart'
import { addCartItem, clearCart, removeCartItem, updateCartItem } from '../services/cart.service'
import { cartKeys } from './use-cart'

export function isLineAlreadyRemoved(error: unknown): boolean {
  return isApiError(error) && error.code === 'cart_item_not_found'
}

function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<ApiResult<Cart>>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (result) => queryClient.setQueryData(cartKeys.all, result),
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

export function useAddToCart() {
  return useCartMutation(({ productId, quantity }: { productId: string; quantity: number }) =>
    addCartItem(productId, quantity),
  )
}

export function useUpdateCartItem() {
  return useCartMutation(({ productId, quantity }: { productId: string; quantity: number }) =>
    updateCartItem(productId, quantity),
  )
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => removeCartItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.all })
      const previous = queryClient.getQueryData<ApiResult<Cart>>(cartKeys.all)
      if (previous) queryClient.setQueryData(cartKeys.all, { ...previous, data: withoutLine(previous.data, productId) })
      return { previous }
    },
    onSuccess: (result) => queryClient.setQueryData(cartKeys.all, result),
    onError: (error, _productId, context) => {
      // Already gone on the server: the optimistic state was right, keep it.
      if (!isLineAlreadyRemoved(error) && context?.previous) {
        queryClient.setQueryData(cartKeys.all, context.previous)
      }
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

export function useClearCart() {
  return useCartMutation(() => clearCart())
}
