import { createSerializer, debounce, parseAsFloat, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'

import { paths } from '@/shared/config/routes'

export const catalogFilterParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString,
  min: parseAsFloat,
  max: parseAsFloat,
  page: parseAsInteger.withDefault(1),
}

const serializeCatalog = createSerializer(catalogFilterParsers)

export function productsUrl(filters: Parameters<typeof serializeCatalog>[1] = {}) {
  return serializeCatalog(paths.products, filters)
}

export const SEARCH_URL_DEBOUNCE_MS = 300

export type PriceRange = { min: number | null; max: number | null }

export function useCatalogFilters() {
  const [filters, setFilters] = useQueryStates(catalogFilterParsers)

  return {
    filters,
    hasActiveFilters: Boolean(filters.q || filters.category || filters.min !== null || filters.max !== null),
    /** Typing: replace history (no entry per keystroke) and debounce URL writes. */
    setSearch: (q: string) =>
      setFilters({ q, page: null }, { history: 'replace', limitUrlUpdates: debounce(SEARCH_URL_DEBOUNCE_MS) }),
    /** Deliberate choices (category, price, page): one history entry each. */
    setCategory: (category: string | null) => setFilters({ category, page: null }, { history: 'push' }),
    setPriceRange: ({ min, max }: PriceRange) => setFilters({ min, max, page: null }, { history: 'push' }),
    setPage: (page: number) => setFilters({ page }, { history: 'push' }),
    clear: () => setFilters(null, { history: 'push' }),
  }
}
