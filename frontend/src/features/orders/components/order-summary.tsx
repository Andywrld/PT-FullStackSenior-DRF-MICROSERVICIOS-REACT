import type { ReactNode } from 'react'

import { formatDateTime } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'

import type { Order } from '../model/order'

type OrderSummaryProps = {
  order: Order
  children?: ReactNode
}

export function OrderSummary({ order, children }: OrderSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Fecha</dt>
          <dd className="text-right tabular-nums">{formatDateTime(order.created_at)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Productos</dt>
          <dd className="tabular-nums">{order.items.length}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Unidades</dt>
          <dd className="tabular-nums">{order.total_quantity}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="font-medium">Total</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatMoney(order.subtotal)}</dd>
        </div>
      </dl>
      {children}
    </div>
  )
}
