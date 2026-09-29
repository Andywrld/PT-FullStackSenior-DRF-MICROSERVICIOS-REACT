import { ChevronRightIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { ProductPurchase } from '@/features/cart/containers/product-purchase'
import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/money'
import { Skeleton } from '@/shared/ui/skeleton'

import { ProductGallery } from '../components/product-gallery'
import { RelatedProducts } from '../containers/related-products'
import { productsUrl } from '../filters/catalog-filters'
import { useProduct } from '../hooks/use-products'

export function ProductPage() {
  const { productId = '' } = useParams()
  const product = useProduct(productId)

  if (product.isPending) return <ProductPageSkeleton />
  if (product.isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p role="alert" className="text-destructive">
          {product.error.status === 404 ? 'Este producto no existe.' : getErrorMessage(product.error)}
        </p>
        <Link to={paths.products} className="text-primary underline underline-offset-4">
          Volver a los productos
        </Link>
      </div>
    )
  }

  const { data } = product.data
  const available = data.stock > 0

  return (
    <div className="flex flex-col gap-14">
      <article className="flex flex-col gap-6">
        <nav aria-label="Ruta de navegación">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to={paths.products} className="transition-colors hover:text-foreground">
                Productos
              </Link>
            </li>
            {data.category && (
              <li className="flex items-center gap-1.5">
                <ChevronRightIcon className="size-3.5" aria-hidden="true" />
                <Link to={productsUrl({ category: data.category.id })} className="transition-colors hover:text-foreground">
                  {data.category.name}
                </Link>
              </li>
            )}
          </ol>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <ProductGallery images={data.images} alt={data.name} />

          <div className="flex flex-col gap-5 md:py-2">
            <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">{data.name}</h1>
            <p className="text-2xl font-medium tabular-nums">{formatMoney(data.price)}</p>
            <p className={available ? 'text-sm text-success' : 'text-sm text-destructive'}>
              {available ? 'En stock' : 'Agotado'}
            </p>
            {available && (
              // key: a new product starts again at quantity 1.
              <ProductPurchase key={data.id} productId={data.id} productName={data.name} stock={data.stock} />
            )}
            {data.description && (
              <p className="max-w-[65ch] leading-relaxed text-pretty text-muted-foreground">{data.description}</p>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-5 text-sm">
              {data.category && (
                <>
                  <dt className="text-muted-foreground">Categoría</dt>
                  <dd>{data.category.name}</dd>
                </>
              )}
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-mono text-xs leading-5">{data.sku}</dd>
            </dl>
          </div>
        </div>
      </article>

      {data.category && <RelatedProducts categoryId={data.category.id} excludeId={data.id} />}
    </div>
  )
}

function ProductPageSkeleton() {
  return (
    <div className="grid gap-10 pt-12 md:grid-cols-2 md:gap-14" aria-busy="true" aria-label="Cargando producto">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="flex flex-col gap-4 md:py-2">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
