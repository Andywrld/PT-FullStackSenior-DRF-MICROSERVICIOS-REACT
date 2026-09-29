import { PencilIcon, Trash2Icon } from 'lucide-react'

import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header'
import { createDataTableColumnHelper, FIT_COLUMN } from '@/shared/components/data-table/data-table-features'
import { DataTableRowActions, type RowAction } from '@/shared/components/data-table/data-table-row-actions'
import { formatDate } from '@/shared/lib/date'

import { ActiveBadge } from '../../components/active-badge'
import type { AdminUser } from '../model/admin-user'
import { RoleBadge } from './role-badge'

const column = createDataTableColumnHelper<AdminUser>()

function initials(user: AdminUser) {
  const source = user.full_name.trim() || user.email
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

type UserColumnHandlers = {
  currentUserId: string | undefined
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

// Sortable ids match the backend's `ordering` fields (email, date_joined).
export function createUserColumns({ currentUserId, onEdit, onDelete }: UserColumnHandlers) {
  return column.columns([
    column.accessor('email', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {initials(user)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-2 font-medium">
                <span className="max-w-60 truncate">{user.full_name || 'Sin nombre'}</span>
                {user.id === currentUserId && (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.6875rem] text-primary">Tú</span>
                )}
              </span>
              <span className="max-w-72 truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    }),
    column.accessor('role', {
      header: 'Rol',
      enableSorting: false,
      cell: (info) => <RoleBadge role={info.getValue()} />,
      meta: { className: FIT_COLUMN },
    }),
    column.accessor('is_active', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) => <ActiveBadge active={info.getValue()} activeLabel="Activo" inactiveLabel="Inactivo" />,
      meta: { className: FIT_COLUMN },
    }),
    column.accessor('date_joined', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Alta" />,
      cell: (info) => formatDate(info.getValue()),
      meta: { className: `${FIT_COLUMN} tabular-nums` },
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const user = row.original
        const actions: RowAction[] = [{ label: `Editar ${user.email}`, icon: PencilIcon, onClick: () => onEdit(user) }]
        // Nobody deletes their own account from here.
        if (user.id !== currentUserId) {
          actions.push({ label: `Eliminar ${user.email}`, icon: Trash2Icon, onClick: () => onDelete(user), destructive: true })
        }
        return <DataTableRowActions actions={actions} />
      },
      meta: { className: `${FIT_COLUMN} text-right` },
    }),
  ])
}
