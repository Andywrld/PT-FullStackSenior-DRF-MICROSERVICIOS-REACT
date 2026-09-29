import type { SortingState } from '@tanstack/react-table'
import { debounce, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'

import { orderingToSorting, sortingToOrdering } from './ordering'

export const TABLE_SEARCH_DEBOUNCE_MS = 300

const dataTableParsers = {
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  sort: parseAsString.withDefault(''),
}

/** Search, page and sort of a server-side table, kept in the URL (shareable, survives a reload). */
export function useDataTableUrlState() {
  const [state, setState] = useQueryStates(dataTableParsers)

  return {
    search: state.q,
    page: state.page,
    ordering: state.sort || undefined,
    sorting: orderingToSorting(state.sort),
    setSearch: (q: string) =>
      setState({ q: q || null, page: null }, { history: 'replace', limitUrlUpdates: debounce(TABLE_SEARCH_DEBOUNCE_MS) }),
    setSorting: (sorting: SortingState) => setState({ sort: sortingToOrdering(sorting), page: null }),
    setPage: (page: number) => setState({ page: page > 1 ? page : null }),
    resetPage: () => setState({ page: null }),
    clear: () => setState({ q: null, page: null }),
  }
}
