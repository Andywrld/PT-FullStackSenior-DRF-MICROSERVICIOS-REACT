import { PencilIcon, Trash2Icon } from 'lucide-react'

import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header'
import { createDataTableColumnHelper, FIT_COLUMN } from '@/shared/components/data-table/data-table-features'
import { DataTableRowActions } from '@/shared/components/data-table/data-table-row-actions'
import { formatDate } from '@/shared/lib/date'

import { ActiveBadge } from '../../components/active-badge'
import type { AdminCategory } from '../model/admin-category'

const column = createDataTableColumnHelper<AdminCategory>()

type CategoryColumnHandlers = {
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}

export function createCategoryColumns({ onEdit, onDelete }: CategoryColumnHandlers) {
  return column.columns([
    column.accessor('name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">/{row.original.slug}</span>
        </div>
      ),
    }),
    column.accessor('description', {
      header: 'Descripción',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <span className="line-clamp-2 max-w-md text-muted-foreground">{info.getValue()}</span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        ),
    }),
    column.accessor('product_count', {
      header: 'Productos',
      enableSorting: false,
      meta: { className: `${FIT_COLUMN} text-right tabular-nums` },
    }),
    column.accessor('is_active', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) => <ActiveBadge active={info.getValue()} activeLabel="Activa" inactiveLabel="Inactiva" />,
      meta: { className: FIT_COLUMN },
    }),
    column.accessor('created_at', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Creada" />,
      cell: (info) => formatDate(info.getValue()),
      meta: { className: `${FIT_COLUMN} tabular-nums` },
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
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
      meta: { className: `${FIT_COLUMN} text-right` },
    }),
  ])
}
