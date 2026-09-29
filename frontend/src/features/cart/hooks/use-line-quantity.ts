import { useState } from 'react'

import { useDebouncedCallback } from '@/shared/hooks/use-debounced-callback'

import { isLineAlreadyRemoved, useRemoveCartItem, useUpdateCartItem } from './use-cart-mutations'

type Options = {
  onError?: (error: unknown) => void
  onRemoved?: () => void
}

export function useLineQuantity(productId: string, serverQuantity: number, { onError, onRemoved }: Options = {}) {
  const [draft, setDraft] = useState<number | null>(null)
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()

  const commit = useDebouncedCallback((quantity: number) => {
    update.mutate({ productId, quantity }, { onError, onSettled: () => setDraft(null) })
  })

  return {
    quantity: draft ?? serverQuantity,
    busy: update.isPending || remove.isPending,
    change: (quantity: number) => {
      setDraft(quantity)
      commit(quantity)
    },
    remove: () => {
      // A quantity change still waiting must not reach the server after the delete.
      commit.cancel()
      setDraft(null)
      // Awaited instead of mutate() callbacks: the removed line unmounts right
      // away, and React Query skips mutate() callbacks of unmounted components.
      remove.mutateAsync(productId).then(
        () => onRemoved?.(),
        (error: unknown) => (isLineAlreadyRemoved(error) ? onRemoved?.() : onError?.(error)),
      )
    },
  }
}
