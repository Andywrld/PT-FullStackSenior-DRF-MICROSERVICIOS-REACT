import { Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'

import { QuantityStepper } from '@/shared/components/quantity-stepper'
import { paths } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

import { type CartLine as CartLineModel, MAX_LINE_QUANTITY } from '../model/cart'

type CartLineProps = {
  line: CartLineModel
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  busy?: boolean
  compact?: boolean
  onNavigate?: () => void
}

export function CartLine({ line, quantity, onQuantityChange, onRemove, busy, compact, onNavigate }: CartLineProps) {
  const imageSize = compact ? 'size-16' : 'size-20 sm:size-24'
  const maxQuantity = Math.min(line.stock ?? quantity, MAX_LINE_QUANTITY)

  return (
    <li className={cn('flex gap-4 py-4 transition-opacity', busy && 'opacity-70')}>
      <div className={cn('shrink-0 overflow-hidden rounded-lg bg-muted', imageSize)}>
        <img
          src={line.image_url ?? '/images/product-default.png'}
          alt=""
          className={cn('size-full object-cover', !line.available && 'grayscale')}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          {line.available ? (
            <Link
              to={paths.product(line.product_id)}
              onClick={onNavigate}
              className="line-clamp-2 text-sm font-medium hover:underline"
            >
              {line.name}
            </Link>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">{line.name ?? 'Producto no disponible'}</p>
          )}
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {line.available ? formatMoney(line.line_total) : '—'}
          </p>
        </div>

        {line.available ? (
          <p className="text-xs text-muted-foreground tabular-nums">{formatMoney(line.unit_price ?? '0')} c/u</p>
        ) : (
          <p className="text-xs text-destructive">Ya no está disponible. Quítalo para continuar.</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          {line.available ? (
            <QuantityStepper
              value={quantity}
              max={maxQuantity}
              onChange={onQuantityChange}
              size={compact ? 'sm' : 'default'}
            />
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size={compact ? 'icon-xs' : 'icon-sm'}
            aria-label={`Quitar ${line.name ?? 'producto'} del carrito`}
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    </li>
  )
}
