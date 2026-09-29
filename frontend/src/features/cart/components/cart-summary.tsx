import type { ReactNode } from 'react'

import { formatMoney } from '@/shared/lib/money'

import { type Cart, hasUnavailableItems } from '../model/cart'

type CartSummaryProps = {
  cart: Cart
  children?: ReactNode
}

export function CartSummary({ cart, children }: CartSummaryProps) {
  const unavailable = hasUnavailableItems(cart)

  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Productos</dt>
          <dd className="tabular-nums">{cart.items.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Unidades</dt>
          <dd className="tabular-nums">{cart.total_quantity}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t pt-3">
          <dt className="font-medium">Subtotal</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatMoney(cart.subtotal)}</dd>
        </div>
      </dl>
      {unavailable && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Hay productos que ya no están disponibles. Quítalos para poder generar la orden.
        </p>
      )}
      {children}
    </div>
  )
}
