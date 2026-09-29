import { ShoppingCartIcon } from 'lucide-react'

import { useCartCount } from '@/features/cart/hooks/use-cart'
import { Button } from '@/shared/ui/button'

export function CartButton({ onClick }: { onClick: () => void }) {
  const count = useCartCount()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={count ? `Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}` : 'Carrito'}
      className="relative"
    >
      <ShoppingCartIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-4.5 animate-in items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4.5 font-semibold text-primary-foreground tabular-nums duration-200 zoom-in-50"
        >
          {count}
        </span>
      )}
    </Button>
  )
}
