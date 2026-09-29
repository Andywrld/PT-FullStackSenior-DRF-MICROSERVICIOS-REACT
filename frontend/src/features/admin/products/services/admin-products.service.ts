import { z } from 'zod'

import { productImageSchema } from '@/features/catalog/model/product'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/api'

import { isActiveParam } from '../../model/active-status'
import { adminProductSchema, type AdminProductsQuery, type ProductPayload } from '../model/admin-product'

export const ADMIN_PRODUCTS_PAGE_SIZE = 20

export function fetchAdminProducts({ page, search, category, status, ordering }: AdminProductsQuery) {
  return apiGet('/products/', z.array(adminProductSchema), {
    page,
    page_size: ADMIN_PRODUCTS_PAGE_SIZE,
    search: search || undefined,
    category,
    is_active: isActiveParam(status),
    ordering,
  })
}

export function fetchAdminProduct(productId: string) {
  return apiGet(`/products/${productId}/`, adminProductSchema)
}

export function createProduct(payload: ProductPayload) {
  return apiPost('/products/', adminProductSchema, payload)
}

export function updateProduct(productId: string, payload: ProductPayload) {
  return apiPatch(`/products/${productId}/`, adminProductSchema, payload)
}

export function deleteProduct(productId: string) {
  return apiDelete(`/products/${productId}/`, z.null())
}

export function uploadProductImage(productId: string, file: File) {
  const body = new FormData()
  body.append('image', file)
  return apiPost(`/products/${productId}/images/`, productImageSchema, body)
}

export function deleteProductImage(productId: string, imageId: string) {
  return apiDelete(`/products/${productId}/images/${imageId}/`, z.null())
}
