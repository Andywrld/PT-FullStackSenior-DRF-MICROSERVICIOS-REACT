import { HomeIcon, LayoutGridIcon, SearchIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

import { useCartCount } from '@/features/cart/hooks/use-cart'
import { paths } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'

type MobileDockProps = {
  searchOpen: boolean
  categoriesOpen: boolean
  onOpenSearch: () => void
  onOpenCategories: () => void
}

const ITEM =
  'flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2.5 py-1.5 text-[0.6875rem] font-medium text-muted-foreground transition-[color,transform] duration-(--duration-fast) ease-(--ease-out-quart) active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&_svg]:size-5'

export function MobileDock({ searchOpen, categoriesOpen, onOpenSearch, onOpenCategories }: MobileDockProps) {
  const cartCount = useCartCount()
  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-(--z-index-dock) flex justify-center px-4 md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full border bg-background/85 p-1.5 shadow-lg shadow-foreground/5 backdrop-blur-md">
        <NavLink to={paths.products} className={({ isActive }) => cn(ITEM, isActive && !searchOpen && !categoriesOpen && 'text-primary')}>
          <HomeIcon />
          Tienda
        </NavLink>
        <DockButton label="Buscar" active={searchOpen} onClick={onOpenSearch}>
          <SearchIcon />
        </DockButton>
        <DockButton label="Categorías" active={categoriesOpen} onClick={onOpenCategories}>
          <LayoutGridIcon />
        </DockButton>
        <NavLink
          to={paths.cart}
          aria-label={cartCount ? `Carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}` : undefined}
          className={({ isActive }) => cn(ITEM, 'relative', isActive && !searchOpen && !categoriesOpen && 'text-primary')}
        >
          <ShoppingCartIcon />
          Carrito
          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-3 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.5625rem] leading-4 font-semibold text-primary-foreground tabular-nums"
            >
              {cartCount}
            </span>
          )}
        </NavLink>
        <NavLink
          to={paths.account}
          className={({ isActive }) => cn(ITEM, isActive && !searchOpen && !categoriesOpen && 'text-primary')}
        >
          <UserIcon />
          Cuenta
        </NavLink>
      </div>
    </nav>
  )
}

function DockButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} aria-expanded={active} className={cn(ITEM, active && 'text-primary')}>
      {children}
      {label}
    </button>
  )
}
