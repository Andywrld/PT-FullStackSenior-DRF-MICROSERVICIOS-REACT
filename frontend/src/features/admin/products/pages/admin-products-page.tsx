import { CircleDotIcon, PackageSearchIcon, PlusIcon, TagIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useCategories } from '@/features/catalog/hooks/use-categories'
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
import { createProductColumns } from '../components/admin-product-columns'
import { DeleteProductDialog } from '../containers/delete-product-dialog'
import { ProductDetailSheet } from '../containers/product-detail-sheet'
import { ProductFormDialog } from '../containers/product-form-dialog'
import { useAdminProductsFilters } from '../filters/admin-products-filters'
import { useAdminProducts } from '../hooks/use-admin-products'
import type { AdminProduct } from '../model/admin-product'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

export function AdminProductsPage() {
  const filters = useAdminProductsFilters()
  const search = useDebouncedValue(filters.search, TABLE_SEARCH_DEBOUNCE_MS)
  const products = useAdminProducts({
    page: filters.page,
    search,
    category: filters.category ?? undefined,
    status: filters.status ?? undefined,
    ordering: filters.ordering,
  })
  const categories = useCategories()
  const pagination = products.data?.meta.pagination
  const total = pagination?.total_items

  const [panel, setPanel] = useState<'form' | 'detail' | 'delete' | null>(null)
  const [selected, setSelected] = useState<AdminProduct | null>(null)
  const [formProductId, setFormProductId] = useState<string | null>(null)

  const openForm = (productId: string | null) => {
    setFormProductId(productId)
    setPanel('form')
  }
  const columns = useMemo(
    () =>
      createProductColumns({
        onView: (product) => {
          setSelected(product)
          setPanel('detail')
        },
        onEdit: (product) => openForm(product.id),
        onDelete: (product) => {
          setSelected(product)
          setPanel('delete')
        },
      }),
    [],
  )
  const closePanel = (open: boolean) => !open && setPanel(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Productos"
        description={total === undefined ? undefined : `${total} ${total === 1 ? 'producto' : 'productos'}`}
        actions={
          <Button onClick={() => openForm(null)}>
            <PlusIcon />
            Nuevo producto
          </Button>
        }
      />
      <DataTable
        label="Productos"
        columns={columns}
        data={products.data?.data}
        getRowId={(product) => product.id}
        loading={products.isPending}
        refreshing={products.isFetching && !products.isPending}
        error={products.isError ? getErrorMessage(products.error) : undefined}
        sorting={filters.sorting}
        onSortingChange={filters.setSorting}
        search={
          <DataTableSearch
            value={filters.search}
            onChange={filters.setSearch}
            placeholder="Buscar por nombre o SKU"
            label="Buscar productos"
          />
        }
        filters={
          <>
            <DataTableSelectFilter
              label="Categoría"
              allLabel="Todas las categorías"
              icon={TagIcon}
              value={filters.category}
              options={(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))}
              onChange={filters.setCategory}
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
              <PackageSearchIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{filters.hasFilters ? 'Ningún producto coincide' : 'Todavía no hay productos'}</p>
              <p className="text-sm text-muted-foreground">
                {filters.hasFilters ? 'Prueba con otra búsqueda o quita los filtros.' : 'Crea el primero para abrir la tienda.'}
              </p>
            </div>
            {!filters.hasFilters && (
              <Button variant="outline" onClick={() => openForm(null)}>
                <PlusIcon />
                Nuevo producto
              </Button>
            )}
          </>
        }
        footer={pagination && <DataTablePagination pagination={pagination} onPageChange={filters.setPage} />}
      />
      <ProductFormDialog open={panel === 'form'} productId={formProductId} onOpenChange={closePanel} />
      <ProductDetailSheet
        open={panel === 'detail'}
        productId={selected?.id ?? null}
        onOpenChange={closePanel}
        onEdit={openForm}
      />
      <DeleteProductDialog open={panel === 'delete'} product={selected} onOpenChange={closePanel} />
    </div>
  )
}
