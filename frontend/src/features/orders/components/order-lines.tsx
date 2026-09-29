import { Link } from 'react-router'

import { paths } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/money'

import type { OrderItem } from '../model/order'
import { OrderItemThumb } from './order-item-thumb'

export function OrderLines({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y border-y">
      {items.map((item) => (
        <li key={item.product_id} className="flex items-center gap-4 py-4">
          <OrderItemThumb imageUrl={item.image_url} className="size-16 sm:size-20" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Link to={paths.product(item.product_id)} className="line-clamp-2 text-sm font-medium hover:underline">
              {item.product_name}
            </Link>
            <p className="text-xs text-muted-foreground tabular-nums">
              {item.quantity} × {formatMoney(item.unit_price)}
            </p>
          </div>
          <p className="shrink-0 self-start text-sm font-semibold tabular-nums">{formatMoney(item.line_total)}</p>
        </li>
      ))}
    </ul>
  )
}
