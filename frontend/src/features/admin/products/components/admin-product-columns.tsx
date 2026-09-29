import { EyeIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { ProductImage } from '@/features/catalog/components/product-image'
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header'
import { createDataTableColumnHelper, FIT_COLUMN as FIT } from '@/shared/components/data-table/data-table-features'
import { DataTableRowActions } from '@/shared/components/data-table/data-table-row-actions'
import { formatDate } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'

import { ActiveBadge } from '../../components/active-badge'
import type { AdminProduct } from '../model/admin-product'

const column = createDataTableColumnHelper<AdminProduct>()

type ProductColumnHandlers = {
  onView: (product: AdminProduct) => void
  onEdit: (product: AdminProduct) => void
  onDelete: (product: AdminProduct) => void
}

// Column ids double as the backend's `ordering` fields (name, price, stock, created_at).
export function createProductColumns({ onView, onEdit, onDelete }: ProductColumnHandlers) {
  return column.columns([
    column.accessor('name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Producto" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            <ProductImage image={row.original.images[0]} alt="" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="max-w-72 truncate font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.sku}</span>
          </div>
        </div>
      ),
    }),
    column.accessor((product) => product.category?.name ?? null, {
      id: 'category',
      header: 'Categoría',
      enableSorting: false,
      cell: (info) => info.getValue() ?? <span className="text-muted-foreground">Sin categoría</span>,
      meta: { className: FIT },
    }),
    column.accessor('price', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Precio" />,
      cell: (info) => formatMoney(info.getValue()),
      meta: { className: `${FIT} text-right tabular-nums` },
    }),
    column.accessor('stock', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
      cell: (info) => (
        <span className={cn(info.getValue() === 0 && 'font-medium text-destructive')}>{info.getValue()}</span>
      ),
      meta: { className: `${FIT} text-right tabular-nums` },
    }),
    column.accessor('is_active', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) => <ActiveBadge active={info.getValue()} activeLabel="Activo" inactiveLabel="Inactivo" />,
      meta: { className: FIT },
    }),
    column.accessor('created_at', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
      cell: (info) => formatDate(info.getValue()),
      meta: { className: `${FIT} tabular-nums` },
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            { label: `Ver ${row.original.name}`, icon: EyeIcon, onClick: () => onView(row.original) },
            { label: `Editar ${row.original.name}`, icon: PencilIcon, onClick: () => onEdit(row.original) },
            {
              label: `Eliminar ${row.original.name}`,
              icon: Trash2Icon,
              onClick: () => onDelete(row.original),
              destructive: true,
            },
          ]}
        />
      ),
      meta: { className: `${FIT} text-right` },
    }),
  ])
}
