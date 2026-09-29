import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { useDataTableUrlState } from '@/shared/components/data-table/use-data-table-url-state'

import { ACTIVE_STATUSES, type ActiveStatus } from '../../model/active-status'

const filterParsers = {
  category: parseAsString,
  status: parseAsStringLiteral(ACTIVE_STATUSES),
}

export function useAdminProductsFilters() {
  const table = useDataTableUrlState()
  const [filters, setFilters] = useQueryStates(filterParsers)

  return {
    ...table,
    category: filters.category,
    status: filters.status,
    hasFilters: Boolean(table.search || filters.category || filters.status),
    setCategory: (category: string | null) => {
      void setFilters({ category })
      void table.resetPage()
    },
    setStatus: (status: ActiveStatus | null) => {
      void setFilters({ status })
      void table.resetPage()
    },
    clear: () => {
      void setFilters(null)
      void table.clear()
    },
  }
}
