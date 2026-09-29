import { parseAsStringLiteral, useQueryState } from 'nuqs'

import { useDataTableUrlState } from '@/shared/components/data-table/use-data-table-url-state'

import { ORDER_PERIODS, type OrderPeriod } from '../model/order-period'

export function useAdminOrdersFilters() {
  const table = useDataTableUrlState()
  const [period, setPeriod] = useQueryState('period', parseAsStringLiteral(ORDER_PERIODS))

  return {
    ...table,
    period,
    hasFilters: Boolean(table.search || period),
    setPeriod: (next: OrderPeriod | null) => {
      void setPeriod(next)
      void table.resetPage()
    },
    clear: () => {
      void setPeriod(null)
      void table.clear()
    },
  }
}
