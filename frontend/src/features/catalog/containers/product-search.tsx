import { ArrowRightIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { getErrorMessage } from '@/shared/api/error-messages'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { paths } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/money'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { Skeleton } from '@/shared/ui/skeleton'

import { productsUrl } from '../filters/catalog-filters'
import { useCategories } from '../hooks/use-categories'
import { SEARCH_MIN_LENGTH, useProductSearch } from '../hooks/use-product-search'
import type { Product } from '../model/product'

type ProductSearchProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductSearch({ open, onOpenChange }: ProductSearchProps) {
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebouncedValue(term)
  const navigate = useNavigate()
  const results = useProductSearch(debouncedTerm)
  const categories = useCategories()
  const searching = debouncedTerm.trim().length >= SEARCH_MIN_LENGTH

  function go(to: string) {
    onOpenChange(false)
    setTerm('')
    navigate(to)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar productos"
      description="Busca en el catálogo por nombre o SKU."
      className="sm:max-w-xl"
    >
      {/* Results come from the server, so cmdk's client-side filter is off. */}
      <Command shouldFilter={false}>
        <CommandInput value={term} onValueChange={setTerm} placeholder="Buscar productos o SKU…" />
        <CommandList className="max-h-[min(28rem,60svh)]">
          {!searching && (
            <CommandGroup heading="Explorar por categoría">
              {categories.data?.data.map((category) => (
                <CommandItem key={category.id} value={category.id} onSelect={() => go(productsUrl({ category: category.id }))}>
                  <span className="flex-1">{category.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{category.product_count}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searching && results.isPending && <SearchSkeleton />}

          {searching && results.isError && (
            <p role="alert" className="px-4 py-6 text-center text-sm text-destructive">
              {getErrorMessage(results.error)}
            </p>
          )}

          {searching && results.isSuccess && (
            <>
              <CommandEmpty>No hay productos para “{debouncedTerm.trim()}”.</CommandEmpty>
              {results.data.data.length > 0 && (
                <CommandGroup heading="Productos">
                  {results.data.data.map((product) => (
                    <CommandItem key={product.id} value={product.id} onSelect={() => go(paths.product(product.id))}>
                      <ResultRow product={product} />
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="see-all"
                    onSelect={() => go(productsUrl({ q: debouncedTerm.trim() }))}
                  >
                    <SearchIcon />
                    <span className="flex-1">Ver todos los resultados de “{debouncedTerm.trim()}”</span>
                    <ArrowRightIcon />
                  </CommandItem>
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

function ResultRow({ product }: { product: Product }) {
  const cover = product.images[0]
  return (
    <>
      <span className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {cover && <img src={cover.url} alt="" loading="lazy" className="size-full object-cover" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{product.name}</span>
        <span className="truncate text-xs text-muted-foreground">{product.category?.name ?? product.sku}</span>
      </span>
      <span className="text-sm font-medium tabular-nums">{formatMoney(product.price)}</span>
    </>
  )
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3" aria-label="Buscando">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
