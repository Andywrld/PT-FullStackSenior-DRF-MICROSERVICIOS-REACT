import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.uuid(),
  product_name: z.string(),
  // Snapshot taken at checkout; null for orders placed before images were stored.
  image_url: z.string().nullable(),
  unit_price: z.string(),
  quantity: z.number(),
  line_total: z.string(),
})

export const orderSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  customer_email: z.string(),
  status: z.string(),
  subtotal: z.string(),
  total_quantity: z.number(),
  items: z.array(orderItemSchema),
  created_at: z.string(),
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type Order = z.infer<typeof orderSchema>

export type OrderPageState = { justPlaced?: boolean }

const STATUS_LABELS: Record<string, string> = {
  placed: 'Confirmada',
}

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function orderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase()
}
