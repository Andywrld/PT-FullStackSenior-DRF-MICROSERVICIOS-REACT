import { z } from 'zod'

import { productSchema } from '@/features/catalog/model/product'
import { isApiError } from '@/shared/api/api-error'
import { getErrorMessage } from '@/shared/api/error-messages'

import type { ActiveStatus } from '../../model/active-status'

export const adminProductSchema = productSchema.extend({
  created_at: z.string(),
  updated_at: z.string(),
})

export type AdminProduct = z.infer<typeof adminProductSchema>

export type AdminProductsQuery = {
  page: number
  search: string
  category?: string
  status?: ActiveStatus
  ordering?: string
}

// Same limits as the products service (MAX_IMAGES_PER_PRODUCT, MAX_IMAGE_UPLOAD_MB).
export const MAX_PRODUCT_IMAGES = 8
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

/** Client-side pre-check; the server re-validates the real bytes. */
export function imageFileError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.split(',').includes(file.type)) return `${file.name}: usa JPG, PNG o WEBP.`
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: supera los 5 MB.`
  return null
}

export function imageUploadError(error: unknown): string {
  return (isApiError(error) && error.fieldErrors.image?.[0]) || getErrorMessage(error)
}

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa un nombre.').max(200, 'Máximo 200 caracteres.'),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Ingresa un precio válido, por ejemplo 19.99.'),
  stock: z
    .string()
    .trim()
    .regex(/^\d{1,7}$/, 'Ingresa una cantidad entera, 0 o más.'),
  category_id: z.string().nullable(),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  is_active: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  price: '',
  stock: '0',
  category_id: null,
  description: '',
  is_active: true,
}

export function toProductForm(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    price: product.price,
    stock: String(product.stock),
    category_id: product.category?.id ?? null,
    description: product.description,
    is_active: product.is_active,
  }
}

export function toProductPayload(values: ProductFormValues) {
  return { ...values, stock: Number(values.stock) }
}

export type ProductPayload = ReturnType<typeof toProductPayload>
