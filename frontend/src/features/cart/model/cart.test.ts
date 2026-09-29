import { describe, expect, it } from 'vitest'

import { type Cart, type CartLine, withoutLine } from './cart'

const line = (overrides: Partial<CartLine>): CartLine => ({
  product_id: crypto.randomUUID(),
  name: 'Producto',
  image_url: null,
  unit_price: '0.10',
  quantity: 1,
  line_total: '0.10',
  stock: 10,
  available: true,
  ...overrides,
})

describe('withoutLine', () => {
  const rice = line({ unit_price: '0.10', quantity: 3, line_total: '0.30' })
  const milk = line({ unit_price: '0.20', quantity: 1, line_total: '0.20' })
  const cart: Cart = {
    id: crypto.randomUUID(),
    user_id: crypto.randomUUID(),
    items: [rice, milk],
    subtotal: '0.50',
    total_quantity: 4,
    created_at: '2026-09-28T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
  }

  it('drops the line and recomputes the totals without float drift', () => {
    const result = withoutLine(cart, rice.product_id)

    expect(result.items).toEqual([milk])
    expect(result.subtotal).toBe('0.20') // 0.5 - 0.3 in floats is 0.2000000004
    expect(result.total_quantity).toBe(1)
  })

  it('leaves the cart untouched when the line is not there', () => {
    expect(withoutLine(cart, crypto.randomUUID())).toBe(cart)
  })
})
