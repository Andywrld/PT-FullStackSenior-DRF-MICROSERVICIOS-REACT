import { ArrowRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { paths } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/money'

import type { Product } from '../model/product'
import { ProductImage } from './product-image'

type ProductCardProps = {
  product: Product
  action?: ReactNode
}

export function ProductCard({ product, action }: ProductCardProps) {
  const [cover, alternate] = product.images

  return (
    <article className="group/card relative flex w-full flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <ProductImage
          image={cover}
          alt={product.name}
          className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover/card:scale-105"
        />
        {alternate && (
          <ProductImage
            image={alternate}
            alt=""
            className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-(--ease-out-quart) group-hover/card:opacity-100"
          />
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-full bg-background/90 px-3 py-2 text-xs font-medium text-foreground opacity-0 shadow-sm backdrop-blur-sm transition duration-300 ease-(--ease-out-quart) group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100"
        >
          Ver producto
          <ArrowRightIcon className="size-3.5" />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="h-4 truncate text-xs leading-4 text-muted-foreground">{product.category?.name}</p>
        <h3 className="line-clamp-2 min-h-[2lh] text-sm leading-snug font-medium">
          <Link
            to={paths.product(product.id)}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-sm font-semibold tabular-nums">{formatMoney(product.price)}</p>
      </div>

      {action && <div className="relative z-10">{action}</div>}
    </article>
  )
}
