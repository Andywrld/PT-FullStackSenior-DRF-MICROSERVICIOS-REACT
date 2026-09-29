import { z } from 'zod'

import { apiGet } from '@/shared/api/api'

import { categorySchema, type ProductFilters, productSchema } from '../model/product'

export const PRODUCTS_PAGE_SIZE = 12

export function fetchProducts({
  page = 1,
  pageSize = PRODUCTS_PAGE_SIZE,
  search,
  category,
  minPrice,
  maxPrice,
}: ProductFilters) {
  return apiGet('/products/', z.array(productSchema), {
    page,
    page_size: pageSize,
    is_active: true,
    // Sold-out products stay reachable by link (detail page), but a list should not offer them.
    in_stock: true,
    search: search || undefined,
    category: category || undefined,
    min_price: minPrice,
    max_price: maxPrice,
  })
}

export function fetchProduct(id: string) {
  return apiGet(`/products/${id}/`, productSchema)
}

export function fetchCategories() {
  return apiGet('/categories/', z.array(categorySchema), { is_active: true, page_size: 100 })
}
