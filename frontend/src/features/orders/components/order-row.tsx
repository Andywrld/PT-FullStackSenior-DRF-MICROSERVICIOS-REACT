import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { paths } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'

import { type Order, orderNumber } from '../model/order'
import { OrderItemThumb } from './order-item-thumb'
import { OrderStatusBadge } from './order-status-badge'

const MAX_ROW_THUMBS = 3
const MAX_NAMES = 2

function itemsPreview(order: Order): string {
  const names = order.items.map((item) => item.product_name)
  const rest = names.length - MAX_NAMES
  return rest > 0 ? `${names.slice(0, MAX_NAMES).join(', ')} y ${rest} más` : names.join(', ')
}

export function OrderRow({ order }: { order: Order }) {
  return (
    <li>
      <Link
        to={paths.order(order.id)}
        className="group -mx-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 rounded-xl px-3 py-5 transition-colors duration-(--duration-fast) hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-6"
      >
        <div className="flex -space-x-4 max-sm:[&>*:nth-child(n+2)]:hidden">
          {order.items.slice(0, MAX_ROW_THUMBS).map((item) => (
            <OrderItemThumb key={item.product_id} imageUrl={item.image_url} className="size-14 ring-2 ring-background" />
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium">
            Orden <span className="tabular-nums">#{orderNumber(order.id)}</span>
          </p>
          <p className="truncate text-sm text-muted-foreground">{itemsPreview(order)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatDateTime(order.created_at)} · {order.total_quantity}{' '}
            {order.total_quantity === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="hidden sm:inline-flex" />
        <div className="flex items-center gap-2">
          <p className="font-semibold tabular-nums">{formatMoney(order.subtotal)}</p>
          <ChevronRightIcon className="size-4 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
        </div>
      </Link>
    </li>
  )
}
