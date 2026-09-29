import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'

import { CartLine } from '../components/cart-line'
import { useLineQuantity } from '../hooks/use-line-quantity'
import type { CartLine as CartLineModel } from '../model/cart'

type CartLineItemProps = {
  line: CartLineModel
  compact?: boolean
  onNavigate?: () => void
}

export function CartLineItem({ line, compact, onNavigate }: CartLineItemProps) {
  const lineQuantity = useLineQuantity(line.product_id, line.quantity, {
    onError: (error) => toast.error(getErrorMessage(error)),
    onRemoved: () => toast.success(`${line.name ?? 'Producto'} se quitó del carrito`),
  })

  return (
    <CartLine
      line={line}
      compact={compact}
      onNavigate={onNavigate}
      quantity={lineQuantity.quantity}
      busy={lineQuantity.busy}
      onQuantityChange={lineQuantity.change}
      onRemove={lineQuantity.remove}
    />
  )
}
