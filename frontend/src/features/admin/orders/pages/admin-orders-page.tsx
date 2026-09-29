import { CalendarIcon, ReceiptTextIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { Order } from '@/features/orders/model/order'
import { getErrorMessage } from '@/shared/api/error-messages'
import { DataTable } from '@/shared/components/data-table/data-table'
import { DataTableResetFilters } from '@/shared/components/data-table/data-table-reset-filters'
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination'
import { DataTableSearch } from '@/shared/components/data-table/data-table-search'
import { DataTableSelectFilter } from '@/shared/components/data-table/data-table-select-filter'
import { TABLE_SEARCH_DEBOUNCE_MS } from '@/shared/components/data-table/use-data-table-url-state'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'

import { AdminPageHeader } from '../../components/admin-page-header'
import { createOrderColumns } from '../components/admin-order-columns'
import { OrderDetailSheet } from '../containers/order-detail-sheet'
import { useAdminOrdersFilters } from '../filters/admin-orders-filters'
import { useAdminOrders } from '../hooks/use-admin-orders'
import { ORDER_PERIOD_OPTIONS, type OrderPeriod } from '../model/order-period'

export function AdminOrdersPage() {
  const filters = useAdminOrdersFilters()
  const search = useDebouncedValue(filters.search, TABLE_SEARCH_DEBOUNCE_MS)
  const orders = useAdminOrders({
    page: filters.page,
    search,
    period: filters.period ?? undefined,
    ordering: filters.ordering,
  })
  const pagination = orders.data?.meta.pagination
  const total = pagination?.total_items

  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)
  const columns = useMemo(
    () =>
      createOrderColumns({
        onView: (order) => {
          setSelected(order)
          setDetailOpen(true)
        },
      }),
    [],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Órdenes"
        description={total === undefined ? undefined : `${total} ${total === 1 ? 'orden' : 'órdenes'}`}
      />
      <DataTable
        label="Órdenes"
        columns={columns}
        data={orders.data?.data}
        getRowId={(order) => order.id}
        loading={orders.isPending}
        refreshing={orders.isFetching && !orders.isPending}
        error={orders.isError ? getErrorMessage(orders.error) : undefined}
        sorting={filters.sorting}
        onSortingChange={filters.setSorting}
        search={
          <DataTableSearch
            value={filters.search}
            onChange={filters.setSearch}
            placeholder="Buscar por email o n.º de orden"
            label="Buscar órdenes"
          />
        }
        filters={
          <>
            <DataTableSelectFilter
              label="Fecha"
              allLabel="Todas las fechas"
              icon={CalendarIcon}
              value={filters.period}
              options={ORDER_PERIOD_OPTIONS}
              onChange={(period) => filters.setPeriod(period as OrderPeriod | null)}
            />
            <DataTableResetFilters visible={filters.hasFilters} onReset={filters.clear} />
          </>
        }
        empty={
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ReceiptTextIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{filters.hasFilters ? 'Ninguna orden coincide' : 'Todavía no hay órdenes'}</p>
              <p className="text-sm text-muted-foreground">
                {filters.hasFilters
                  ? 'Prueba con otra búsqueda u otro periodo.'
                  : 'Las órdenes de los clientes aparecerán aquí.'}
              </p>
            </div>
          </>
        }
        footer={pagination && <DataTablePagination pagination={pagination} onPageChange={filters.setPage} />}
      />
      <OrderDetailSheet open={detailOpen} order={selected} onOpenChange={setDetailOpen} />
    </div>
  )
}
