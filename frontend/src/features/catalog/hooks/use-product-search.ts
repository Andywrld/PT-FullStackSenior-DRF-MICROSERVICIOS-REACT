import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchProducts } from '../services/catalog.service'
import { catalogKeys } from './catalog-keys'

export const SEARCH_MIN_LENGTH = 2
const SEARCH_RESULTS = 6

export function useProductSearch(term: string) {
  const search = term.trim()
  return useQuery({
    queryKey: catalogKeys.products({ search, pageSize: SEARCH_RESULTS }),
    queryFn: () => fetchProducts({ search, pageSize: SEARCH_RESULTS }),
    enabled: search.length >= SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
  })
}
