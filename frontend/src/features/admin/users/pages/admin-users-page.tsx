import { CircleDotIcon, PlusIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useSession } from '@/features/auth/hooks/use-session'
import type { Role } from '@/features/auth/model/auth'
import { getErrorMessage } from '@/shared/api/error-messages'
import { DataTable } from '@/shared/components/data-table/data-table'
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination'
import { DataTableResetFilters } from '@/shared/components/data-table/data-table-reset-filters'
import { DataTableSearch } from '@/shared/components/data-table/data-table-search'
import { DataTableSelectFilter } from '@/shared/components/data-table/data-table-select-filter'
import { TABLE_SEARCH_DEBOUNCE_MS } from '@/shared/components/data-table/use-data-table-url-state'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { Button } from '@/shared/ui/button'

import { AdminPageHeader } from '../../components/admin-page-header'
import type { ActiveStatus } from '../../model/active-status'
import { createUserColumns } from '../components/admin-user-columns'
import { DeleteUserDialog } from '../containers/delete-user-dialog'
import { UserFormDialog } from '../containers/user-form-dialog'
import { useAdminUsersFilters } from '../filters/admin-users-filters'
import { useAdminUsers } from '../hooks/use-admin-users'
import { type AdminUser, ROLE_OPTIONS } from '../model/admin-user'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

export function AdminUsersPage() {
  const currentUserId = useSession().user?.id
  const filters = useAdminUsersFilters()
  const search = useDebouncedValue(filters.search, TABLE_SEARCH_DEBOUNCE_MS)
  const users = useAdminUsers({
    page: filters.page,
    search,
    role: filters.role ?? undefined,
    status: filters.status ?? undefined,
    ordering: filters.ordering,
  })
  const pagination = users.data?.meta.pagination
  const total = pagination?.total_items

  const [panel, setPanel] = useState<'form' | 'delete' | null>(null)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const open = (next: 'form' | 'delete', user: AdminUser | null) => {
    setSelected(user)
    setPanel(next)
  }
  const columns = useMemo(
    () =>
      createUserColumns({
        currentUserId,
        onEdit: (user) => open('form', user),
        onDelete: (user) => open('delete', user),
      }),
    [currentUserId],
  )
  const closePanel = (isOpen: boolean) => !isOpen && setPanel(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Usuarios"
        description={total === undefined ? undefined : `${total} ${total === 1 ? 'usuario' : 'usuarios'}`}
        actions={
          <Button onClick={() => open('form', null)}>
            <PlusIcon />
            Nuevo usuario
          </Button>
        }
      />
      <DataTable
        label="Usuarios"
        columns={columns}
        data={users.data?.data}
        getRowId={(user) => user.id}
        loading={users.isPending}
        refreshing={users.isFetching && !users.isPending}
        error={users.isError ? getErrorMessage(users.error) : undefined}
        sorting={filters.sorting}
        onSortingChange={filters.setSorting}
        search={
          <DataTableSearch
            value={filters.search}
            onChange={filters.setSearch}
            placeholder="Buscar por nombre o email"
            label="Buscar usuarios"
          />
        }
        filters={
          <>
            <DataTableSelectFilter
              label="Rol"
              allLabel="Todos los roles"
              icon={ShieldIcon}
              value={filters.role}
              options={ROLE_OPTIONS}
              onChange={(role) => filters.setRole(role as Role | null)}
            />
            <DataTableSelectFilter
              label="Estado"
              allLabel="Todos los estados"
              icon={CircleDotIcon}
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(status) => filters.setStatus(status as ActiveStatus | null)}
            />
            <DataTableResetFilters visible={filters.hasFilters} onReset={filters.clear} />
          </>
        }
        empty={
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UsersIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{filters.hasFilters ? 'Ningún usuario coincide' : 'Todavía no hay usuarios'}</p>
              <p className="text-sm text-muted-foreground">Prueba con otra búsqueda o quita los filtros.</p>
            </div>
          </>
        }
        footer={pagination && <DataTablePagination pagination={pagination} onPageChange={filters.setPage} />}
      />
      <UserFormDialog
        open={panel === 'form'}
        user={selected}
        currentUserId={currentUserId}
        onOpenChange={closePanel}
      />
      <DeleteUserDialog open={panel === 'delete'} user={selected} onOpenChange={closePanel} />
    </div>
  )
}
