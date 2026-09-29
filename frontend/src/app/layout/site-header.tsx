import { LayoutGridIcon, SearchIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { ThemeToggle } from '@/shared/components/theme-toggle'
import { paths } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Kbd } from '@/shared/ui/kbd'

import { AccountMenu } from './account-menu'
import { CartButton } from './cart-button'

type SiteHeaderProps = {
  onOpenSearch: () => void
  onOpenCategories: () => void
  onOpenCart: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function SiteHeader({ onOpenSearch, onOpenCategories, onOpenCart }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-index-sticky) border-b bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link
          to={paths.home}
          className="font-heading text-2xl tracking-tight focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Marketplace
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          <NavLink
            to={paths.products}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                isActive && 'text-foreground',
              )
            }
          >
            Tienda
          </NavLink>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onOpenCategories}>
            <LayoutGridIcon />
            Categorías
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 w-72 items-center gap-2 rounded-lg border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:flex"
          >
            <SearchIcon className="size-4" />
            <span>Buscar productos…</span>
            <Kbd className="ml-auto">{isMac ? '⌘' : 'Ctrl'} K</Kbd>
          </button>
          <CartButton onClick={onOpenCart} />
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
