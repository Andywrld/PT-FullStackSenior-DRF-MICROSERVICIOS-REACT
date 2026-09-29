import { parseAsStringLiteral, useQueryStates } from 'nuqs'

import { type Role, roleSchema } from '@/features/auth/model/auth'
import { useDataTableUrlState } from '@/shared/components/data-table/use-data-table-url-state'

import { ACTIVE_STATUSES, type ActiveStatus } from '../../model/active-status'

const filterParsers = {
  role: parseAsStringLiteral(roleSchema.options),
  status: parseAsStringLiteral(ACTIVE_STATUSES),
}

export function useAdminUsersFilters() {
  const table = useDataTableUrlState()
  const [filters, setFilters] = useQueryStates(filterParsers)

  return {
    ...table,
    role: filters.role,
    status: filters.status,
    hasFilters: Boolean(table.search || filters.role || filters.status),
    setRole: (role: Role | null) => {
      void setFilters({ role })
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
