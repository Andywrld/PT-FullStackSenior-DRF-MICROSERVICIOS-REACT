import { useQuery } from '@tanstack/react-query'

import { fetchCategories } from '../services/catalog.service'
import { catalogKeys } from './catalog-keys'

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 5 * 60_000, // categories rarely change
  })
}
