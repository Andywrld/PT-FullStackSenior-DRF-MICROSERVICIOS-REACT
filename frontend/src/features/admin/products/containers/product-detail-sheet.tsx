import { ExternalLinkIcon, PencilIcon } from 'lucide-react'
import { Link } from 'react-router'

import { ProductGallery } from '@/features/catalog/components/product-gallery'
import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { Skeleton } from '@/shared/ui/skeleton'

import { ActiveBadge } from '../../components/active-badge'
import { useAdminProduct } from '../hooks/use-admin-products'

type ProductDetailSheetProps = {
  open: boolean
  productId: string | null
  onOpenChange: (open: boolean) => void
  onEdit: (productId: string) => void
}

export function ProductDetailSheet({ open, productId, onOpenChange, onEdit }: ProductDetailSheetProps) {
  const product = useAdminProduct(open ? productId : null)
  const data = product.data?.data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(38rem,100vw)] gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="gap-2 border-b px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <SheetTitle className="font-heading text-2xl leading-tight font-normal">
              {data?.name ?? 'Producto'}
            </SheetTitle>
            {data && <ActiveBadge active={data.is_active} activeLabel="Activo" inactiveLabel="Inactivo" />}
          </div>
          <SheetDescription>{data ? `SKU ${data.sku}` : 'Cargando…'}</SheetDescription>
        </SheetHeader>

        {product.isPending ? (
          <div className="flex flex-col gap-4 px-6 py-5" aria-busy="true" aria-label="Cargando producto">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : product.isError || !data ? (
          <p role="alert" className="px-6 py-10 text-center text-sm text-destructive">
            {getErrorMessage(product.error)}
          </p>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
              <ProductGallery images={data.images} alt={data.name} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Detail label="Precio" value={formatMoney(data.price)} />
                <Detail
                  label="Stock"
                  value={data.stock === 0 ? 'Agotado' : `${data.stock} unidades`}
                  className={cn(data.stock === 0 && 'text-destructive')}
                />
                <Detail label="Categoría" value={data.category?.name ?? 'Sin categoría'} />
                <Detail label="Imágenes" value={String(data.images.length)} />
                <Detail label="Creado" value={formatDateTime(data.created_at)} />
                <Detail label="Actualizado" value={formatDateTime(data.updated_at)} />
              </dl>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm text-muted-foreground">Descripción</h3>
                <p className="text-sm leading-relaxed text-pretty whitespace-pre-line">
                  {data.description || 'Sin descripción.'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-surface px-6 py-4 sm:flex-row sm:justify-end">
              <Link
                to={paths.product(data.id)}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                <ExternalLinkIcon />
                Ver en la tienda
              </Link>
              <Button onClick={() => onEdit(data.id)}>
                <PencilIcon />
                Editar
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium tabular-nums', className)}>{value}</dd>
    </div>
  )
}
