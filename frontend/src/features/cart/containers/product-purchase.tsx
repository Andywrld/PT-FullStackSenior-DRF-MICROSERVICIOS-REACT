import { useState } from 'react'

import { QuantityStepper } from '@/shared/components/quantity-stepper'

import { MAX_LINE_QUANTITY } from '../model/cart'
import { AddToCartButton } from './add-to-cart-button'

type ProductPurchaseProps = {
  productId: string
  productName: string
  stock: number
}

export function ProductPurchase({ productId, productName, stock }: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper value={quantity} max={Math.min(stock, MAX_LINE_QUANTITY)} onChange={setQuantity} />
      <AddToCartButton
        productId={productId}
        productName={productName}
        quantity={quantity}
        size="lg"
        className="h-11 flex-1 sm:flex-none sm:px-8"
      />
    </div>
  )
}
