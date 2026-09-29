import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total_items: z.number(),
  total_pages: z.number(),
  has_next: z.boolean(),
  has_previous: z.boolean(),
})

// loose(): services may add extra meta keys (e.g. orders' `cart_cleared`).
export const metaSchema = z
  .object({
    request_id: z.string(),
    pagination: paginationSchema.optional(),
  })
  .loose()

export const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().nullable(),
})

export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  error: apiErrorBodySchema,
  meta: metaSchema,
})

export const successEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  error: z.null(),
  meta: metaSchema,
})

export type Pagination = z.infer<typeof paginationSchema>
export type Meta = z.infer<typeof metaSchema>
