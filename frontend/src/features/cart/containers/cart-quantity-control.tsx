import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'
import { QuantityStepper } from '@/shared/components/quantity-stepper'

import { useCart } from '../hooks/use-cart'
import { useLineQuantity } from '../hooks/use-line-quantity'
import { MAX_LINE_QUANTITY } from '../model/cart'
import { AddToCartButton } from './add-to-cart-button'

type CartQuantityControlProps = {
  productId: string
  productName: string
  stock: number
}

export function CartQuantityControl({ productId, productName, stock }: CartQuantityControlProps) {
  const cart = useCart()
  const line = cart.data?.data.items.find((item) => item.product_id === productId)

  if (!line) {
    return (
      <AddToCartButton
        productId={productId}
        productName={productName}
        label="Agregar"
        size="sm"
        variant="outline"
        className="w-full"
      />
    )
  }
  return <InCartStepper productId={productId} productName={productName} stock={stock} quantity={line.quantity} />
}

function InCartStepper({ productId, productName, stock, quantity }: CartQuantityControlProps & { quantity: number }) {
  const lineQuantity = useLineQuantity(productId, quantity, {
    onError: (error) => toast.error(getErrorMessage(error)),
    onRemoved: () => toast.success(`${productName} se quitó del carrito`),
  })

  return (
    <QuantityStepper
      value={lineQuantity.quantity}
      max={Math.min(stock, MAX_LINE_QUANTITY)}
      onChange={lineQuantity.change}
      onRemove={lineQuantity.remove}
      disabled={lineQuantity.busy && lineQuantity.quantity === quantity}
      size="sm"
      className="h-8 w-full animate-in duration-200 fade-in"
    />
  )
}
