import { EyeIcon } from 'lucide-react'

import { OrderStatusBadge } from '@/features/orders/components/order-status-badge'
import { type Order, orderNumber } from '@/features/orders/model/order'
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header'
import { createDataTableColumnHelper, FIT_COLUMN } from '@/shared/components/data-table/data-table-features'
import { DataTableRowActions } from '@/shared/components/data-table/data-table-row-actions'
import { formatDateTime } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'

const column = createDataTableColumnHelper<Order>()

// Sortable ids match the backend's `ordering` fields (created_at, total_quantity, subtotal).
export function createOrderColumns({ onView }: { onView: (order: Order) => void }) {
  return column.columns([
    column.accessor('id', {
      header: 'Orden',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="rounded-md font-medium tabular-nums hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          #{orderNumber(row.original.id)}
        </button>
      ),
      meta: { className: FIT_COLUMN },
    }),
    column.accessor('customer_email', {
      header: 'Cliente',
      enableSorting: false,
      cell: (info) => <span className="block max-w-72 truncate">{info.getValue()}</span>,
    }),
    column.accessor((order) => order.items.length, {
      id: 'products',
      header: 'Productos',
      enableSorting: false,
      meta: { className: `${FIT_COLUMN} text-right tabular-nums` },
    }),
    column.accessor('total_quantity', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Unidades" />,
      meta: { className: `${FIT_COLUMN} text-right tabular-nums` },
    }),
    column.accessor('subtotal', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      cell: (info) => <span className="font-medium">{formatMoney(info.getValue())}</span>,
      meta: { className: `${FIT_COLUMN} text-right tabular-nums` },
    }),
    column.accessor('status', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) => <OrderStatusBadge status={info.getValue()} />,
      meta: { className: FIT_COLUMN },
    }),
    column.accessor('created_at', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
      cell: (info) => formatDateTime(info.getValue()),
      meta: { className: `${FIT_COLUMN} tabular-nums` },
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            { label: `Ver orden #${orderNumber(row.original.id)}`, icon: EyeIcon, onClick: () => onView(row.original) },
          ]}
        />
      ),
      meta: { className: `${FIT_COLUMN} text-right` },
    }),
  ])
}
