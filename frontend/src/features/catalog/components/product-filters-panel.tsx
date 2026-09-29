import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'

import type { PriceRange } from '../filters/catalog-filters'
import type { Category } from '../model/product'
import { CategoryFilterList } from './category-filter-list'
import { PriceRangeFilter } from './price-range-filter'

type ProductFiltersPanelProps = {
  categories: Category[]
  selectedCategory: string | null
  priceRange: PriceRange
  hasActiveFilters: boolean
  onCategoryChange: (categoryId: string | null) => void
  onPriceRangeChange: (range: PriceRange) => void
  onClear: () => void
}

export function ProductFiltersPanel({
  categories,
  selectedCategory,
  priceRange,
  hasActiveFilters,
  onCategoryChange,
  onPriceRangeChange,
  onClear,
}: ProductFiltersPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Filtros</h2>
        {hasActiveFilters && (
          <Button variant="link" size="sm" className="h-auto px-0" onClick={onClear}>
            Limpiar todo
          </Button>
        )}
      </div>

      <section aria-labelledby="filter-category" className="flex flex-col gap-2">
        <h3 id="filter-category" className="text-xs font-medium text-muted-foreground">
          Categoría
        </h3>
        <CategoryFilterList categories={categories} selected={selectedCategory} onSelect={onCategoryChange} />
      </section>

      <Separator />

      <section aria-labelledby="filter-price" className="flex flex-col gap-3">
        <h3 id="filter-price" className="text-xs font-medium text-muted-foreground">
          Precio
        </h3>
        <PriceRangeFilter
          key={`${priceRange.min}-${priceRange.max}`}
          value={priceRange}
          onChange={onPriceRangeChange}
        />
      </section>
    </div>
  )
}
