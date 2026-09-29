import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ProductFilters } from '../model/product'
import { fetchProduct, fetchProducts } from '../services/catalog.service'
import { catalogKeys } from './catalog-keys'

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: catalogKeys.product(id),
    queryFn: () => fetchProduct(id),
  })
}
