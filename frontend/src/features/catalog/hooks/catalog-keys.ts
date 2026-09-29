import type { ProductFilters } from '../model/product'

export const catalogKeys = {
  all: ['catalog'] as const,
  products: (filters: ProductFilters) => [...catalogKeys.all, 'products', filters] as const,
  product: (id: string) => [...catalogKeys.all, 'product', id] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
}
