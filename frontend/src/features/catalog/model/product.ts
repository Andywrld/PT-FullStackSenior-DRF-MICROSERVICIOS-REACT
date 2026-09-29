import { z } from 'zod'

// Money arrives as a decimal string ("19.99") and stays a string: never parse prices into floats.

export const categorySummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
})

export const categorySchema = categorySummarySchema.extend({
  description: z.string(),
  is_active: z.boolean(),
  product_count: z.number(),
})

export const productImageSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  width: z.number(),
  height: z.number(),
  position: z.number(),
})

export const productSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  stock: z.number(),
  is_active: z.boolean(),
  category: categorySummarySchema.nullable(),
  images: z.array(productImageSchema),
})

export type CategorySummary = z.infer<typeof categorySummarySchema>
export type Category = z.infer<typeof categorySchema>
export type ProductImage = z.infer<typeof productImageSchema>
export type Product = z.infer<typeof productSchema>

export type ProductFilters = {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
}
