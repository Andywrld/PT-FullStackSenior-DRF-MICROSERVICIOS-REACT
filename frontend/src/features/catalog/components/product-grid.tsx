import type { ReactNode } from 'react'

import { Skeleton } from '@/shared/ui/skeleton'

import type { Product } from '../model/product'
import { ProductCard } from './product-card'

type ProductGridProps = {
  products: Product[]
  renderAction?: (product: Product) => ReactNode
}

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-x-5'

export function ProductGrid({ products, renderAction }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">No hay productos que coincidan con tu búsqueda.</p>
  }
  return (
    <ul className={GRID}>
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} action={renderAction?.(product)} />
        </li>
      ))}
    </ul>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className={GRID} aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-[2lh] w-4/5 text-sm leading-snug" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  )
}
