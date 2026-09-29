import { parseAsStringLiteral, useQueryState } from 'nuqs'

import { useDataTableUrlState } from '@/shared/components/data-table/use-data-table-url-state'

import { ACTIVE_STATUSES, type ActiveStatus } from '../../model/active-status'

export function useAdminCategoriesFilters() {
  const table = useDataTableUrlState()
  const [status, setStatus] = useQueryState('status', parseAsStringLiteral(ACTIVE_STATUSES))

  return {
    ...table,
    status,
    hasFilters: Boolean(table.search || status),
    setStatus: (next: ActiveStatus | null) => {
      void setStatus(next)
      void table.resetPage()
    },
    clear: () => {
      void setStatus(null)
      void table.clear()
    },
  }
}
