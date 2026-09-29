import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/money'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { Skeleton } from '@/shared/ui/skeleton'

import { productsUrl } from '../filters/catalog-filters'
import { useCategories } from '../hooks/use-categories'
import { useProducts } from '../hooks/use-products'
import type { Category } from '../model/product'

type CategoriesMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PREVIEW_SIZE = 4

export function CategoriesMenu({ open, onOpenChange }: CategoriesMenuProps) {
  const categories = useCategories()
  const close = () => onOpenChange(false)

  return (
    <Sheet modal="trap-focus" open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(24rem,88vw)] gap-0 p-0">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-heading text-2xl font-normal">Categorías</SheetTitle>
          <SheetDescription>Explora el catálogo por departamento.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {categories.isPending && <CategoriesSkeleton />}
          {categories.isError && (
            <p role="alert" className="py-6 text-sm text-destructive">
              {getErrorMessage(categories.error)}
            </p>
          )}
          {categories.isSuccess && (
            <Accordion>
              {categories.data.data.map((category) => (
                <AccordionItem key={category.id} value={category.id} className="border-b last:border-b-0">
                  <AccordionTrigger className="text-base">
                    <span className="flex-1">{category.name}</span>
                    <span className="text-xs font-normal text-muted-foreground tabular-nums">
                      {category.product_count}
                    </span>
                  </AccordionTrigger>
                  {/* Panels mount on open, so each preview is fetched only when needed. */}
                  <AccordionContent>
                    <CategoryPreview category={category} onNavigate={close} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CategoryPreview({ category, onNavigate }: { category: Category; onNavigate: () => void }) {
  const products = useProducts({ category: category.id, pageSize: PREVIEW_SIZE })

  if (products.isPending) return <CategoriesSkeleton rows={2} />
  if (products.isError) return <p className="text-sm text-destructive">{getErrorMessage(products.error)}</p>

  return (
    <div className="flex flex-col gap-1">
      {products.data.data.map((product) => (
        <Link
          key={product.id}
          to={paths.product(product.id)}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md p-1.5 no-underline! transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="size-11 shrink-0 overflow-hidden rounded-md bg-muted">
            {product.images[0] && (
              <img src={product.images[0].url} alt="" loading="lazy" className="size-full object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{product.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{formatMoney(product.price)}</span>
        </Link>
      ))}
      <Link
        to={productsUrl({ category: category.id })}
        onClick={onNavigate}
        className="mt-1 inline-flex items-center gap-1.5 self-start rounded-md px-1.5 py-1 text-sm font-medium text-primary no-underline! hover:underline! focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Ver todo en {category.name}
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  )
}

function CategoriesSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 py-3" aria-label="Cargando">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  )
}
