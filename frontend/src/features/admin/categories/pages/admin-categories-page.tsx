import { CircleDotIcon, PlusIcon, TagsIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getErrorMessage } from '@/shared/api/error-messages'
import { DataTable } from '@/shared/components/data-table/data-table'
import { DataTableResetFilters } from '@/shared/components/data-table/data-table-reset-filters'
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination'
import { DataTableSearch } from '@/shared/components/data-table/data-table-search'
import { DataTableSelectFilter } from '@/shared/components/data-table/data-table-select-filter'
import { TABLE_SEARCH_DEBOUNCE_MS } from '@/shared/components/data-table/use-data-table-url-state'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { Button } from '@/shared/ui/button'

import { AdminPageHeader } from '../../components/admin-page-header'
import type { ActiveStatus } from '../../model/active-status'
import { createCategoryColumns } from '../components/admin-category-columns'
import { CategoryFormDialog } from '../containers/category-form-dialog'
import { DeleteCategoryDialog } from '../containers/delete-category-dialog'
import { useAdminCategoriesFilters } from '../filters/admin-categories-filters'
import { useAdminCategories } from '../hooks/use-admin-categories'
import type { AdminCategory } from '../model/admin-category'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
]

export function AdminCategoriesPage() {
  const filters = useAdminCategoriesFilters()
  const search = useDebouncedValue(filters.search, TABLE_SEARCH_DEBOUNCE_MS)
  const categories = useAdminCategories({
    page: filters.page,
    search,
    status: filters.status ?? undefined,
    ordering: filters.ordering,
  })
  const pagination = categories.data?.meta.pagination
  const total = pagination?.total_items

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<AdminCategory | null>(null)

  const openForm = (category: AdminCategory | null) => {
    setSelected(category)
    setFormOpen(true)
  }
  const columns = useMemo(
    () =>
      createCategoryColumns({
        onEdit: openForm,
        onDelete: (category) => {
          setSelected(category)
          setDeleteOpen(true)
        },
      }),
    [],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Categorías"
        description={total === undefined ? undefined : `${total} ${total === 1 ? 'categoría' : 'categorías'}`}
        actions={
          <Button onClick={() => openForm(null)}>
            <PlusIcon />
            Nueva categoría
          </Button>
        }
      />
      <DataTable
        label="Categorías"
        columns={columns}
        data={categories.data?.data}
        getRowId={(category) => category.id}
        loading={categories.isPending}
        refreshing={categories.isFetching && !categories.isPending}
        error={categories.isError ? getErrorMessage(categories.error) : undefined}
        sorting={filters.sorting}
        onSortingChange={filters.setSorting}
        search={
          <DataTableSearch
            value={filters.search}
            onChange={filters.setSearch}
            placeholder="Buscar por nombre"
            label="Buscar categorías"
          />
        }
        filters={
          <>
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
              <TagsIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {filters.hasFilters ? 'Ninguna categoría coincide' : 'Todavía no hay categorías'}
              </p>
              <p className="text-sm text-muted-foreground">
                {filters.hasFilters
                  ? 'Prueba con otra búsqueda o quita los filtros.'
                  : 'Crea la primera para organizar el catálogo.'}
              </p>
            </div>
            {!filters.hasFilters && (
              <Button variant="outline" onClick={() => openForm(null)}>
                <PlusIcon />
                Nueva categoría
              </Button>
            )}
          </>
        }
        footer={pagination && <DataTablePagination pagination={pagination} onPageChange={filters.setPage} />}
      />
      <CategoryFormDialog open={formOpen} category={selected} onOpenChange={setFormOpen} />
      <DeleteCategoryDialog open={deleteOpen} category={selected} onOpenChange={setDeleteOpen} />
    </div>
  )
}
