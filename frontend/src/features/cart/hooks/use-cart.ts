import { useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/use-session'

import { fetchCart } from '../services/cart.service'

export const cartKeys = {
  all: ['cart'] as const,
}

export function useCart() {
  const { isAuthenticated } = useSession()
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: fetchCart,
    enabled: isAuthenticated,
    staleTime: 0, // prices and stock can change: always revalidate on mount
  })
}

export function useCartCount() {
  const cart = useCart()
  return cart.data?.data.items.length ?? 0
}
