import { SlidersHorizontalIcon } from 'lucide-react'
import { useState } from 'react'

import { CartQuantityControl } from '@/features/cart/containers/cart-quantity-control'
import { getErrorMessage } from '@/shared/api/error-messages'
import { PaginationControls } from '@/shared/components/pagination-controls'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

import { CatalogSearchField } from '../components/catalog-search-field'
import { ProductFiltersPanel } from '../components/product-filters-panel'
import { ProductGrid, ProductGridSkeleton } from '../components/product-grid'
import { SEARCH_URL_DEBOUNCE_MS, useCatalogFilters } from '../filters/catalog-filters'
import { useCategories } from '../hooks/use-categories'
import { useProducts } from '../hooks/use-products'

export function ProductsPage() {
  const { filters, hasActiveFilters, setSearch, setCategory, setPriceRange, setPage, clear } = useCatalogFilters()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const search = useDebouncedValue(filters.q, SEARCH_URL_DEBOUNCE_MS)

  const products = useProducts({
    page: filters.page,
    search,
    category: filters.category ?? undefined,
    minPrice: filters.min ?? undefined,
    maxPrice: filters.max ?? undefined,
  })
  const categories = useCategories()
  const pagination = products.data?.meta.pagination

  const panel = (
    <ProductFiltersPanel
      categories={categories.data?.data ?? []}
      selectedCategory={filters.category}
      priceRange={{ min: filters.min, max: filters.max }}
      hasActiveFilters={hasActiveFilters}
      onCategoryChange={setCategory}
      onPriceRangeChange={setPriceRange}
      onClear={clear}
    />
  )

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Productos</h1>
            {pagination && (
              <p className="text-sm text-muted-foreground tabular-nums">
                {pagination.total_items} {pagination.total_items === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>
          <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontalIcon />
            Filtros
          </Button>
        </div>
        <CatalogSearchField value={filters.q} onChange={setSearch} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex flex-col gap-10">
          {products.isPending ? (
            <ProductGridSkeleton />
          ) : products.isError ? (
            <p role="alert" className="py-16 text-center text-destructive">
              {getErrorMessage(products.error)}
            </p>
          ) : products.data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-muted-foreground">No hay productos con estos filtros.</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clear}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <ProductGrid
              products={products.data.data}
              renderAction={(product) => (
                <CartQuantityControl productId={product.id} productName={product.name} stock={product.stock} />
              )}
            />
          )}
          {pagination && <PaginationControls pagination={pagination} onPageChange={setPage} />}
        </div>

        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-24">{panel}</div>
        </aside>
      </div>

      <Sheet modal="trap-focus" open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-2xl px-5 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle className="sr-only">Filtros</SheetTitle>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    </section>
  )
}
