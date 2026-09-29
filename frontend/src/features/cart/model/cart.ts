import { z } from 'zod'

// `null` product fields mean the product is no longer available.

export const cartLineSchema = z.object({
  product_id: z.uuid(),
  name: z.string().nullable(),
  image_url: z.string().nullable(),
  unit_price: z.string().nullable(),
  quantity: z.number(),
  line_total: z.string(),
  stock: z.number().nullable(),
  available: z.boolean(),
})

export const cartSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  items: z.array(cartLineSchema),
  subtotal: z.string(),
  total_quantity: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type CartLine = z.infer<typeof cartLineSchema>
export type Cart = z.infer<typeof cartSchema>

/** Same cap as the backend (MAX_LINE_QUANTITY). */
export const MAX_LINE_QUANTITY = 999

export function hasUnavailableItems(cart: Cart): boolean {
  return cart.items.some((line) => !line.available)
}

const toCents = (amount: string) => Math.round(Number(amount) * 100)

export function withoutLine(cart: Cart, productId: string): Cart {
  const removed = cart.items.find((line) => line.product_id === productId)
  if (!removed) return cart
  return {
    ...cart,
    items: cart.items.filter((line) => line !== removed),
    subtotal: ((toCents(cart.subtotal) - toCents(removed.line_total)) / 100).toFixed(2),
    total_quantity: cart.total_quantity - removed.quantity,
  }
}
