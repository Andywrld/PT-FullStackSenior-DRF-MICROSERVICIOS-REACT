import { Link } from 'react-router'

import { productsUrl } from '@/features/catalog/filters/catalog-filters'
import { useCategories } from '@/features/catalog/hooks/use-categories'
import { paths } from '@/shared/config/routes'

const YEAR = new Date().getFullYear()

const LINK =
  'text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'

export function SiteFooter() {
  const categories = useCategories()

  return (
    // Bottom padding on phones = exactly the floating dock, so it never covers content.
    <footer className="border-t bg-surface pb-(--dock-space) md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr]">
        <div className="flex max-w-sm flex-col gap-3">
          <Link to={paths.home} className="font-heading text-3xl tracking-tight">
            Marketplace
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Una tienda curada donde el producto es el protagonista y comprar lleva pocos pasos.
          </p>
        </div>

        <nav aria-label="Comprar por categoría" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Tienda</h2>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to={paths.products} className={LINK}>
                Todos los productos
              </Link>
            </li>
            {categories.data?.data.map((category) => (
              <li key={category.id}>
                <Link to={productsUrl({ category: category.id })} className={LINK}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {YEAR} Marketplace. Precios en USD.
        </p>
      </div>
    </footer>
  )
}
