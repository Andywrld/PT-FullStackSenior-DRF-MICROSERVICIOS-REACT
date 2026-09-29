import { Outlet } from 'react-router'

import { CartDrawer } from '@/features/cart/containers/cart-drawer'
import { CategoriesMenu } from '@/features/catalog/containers/categories-menu'
import { ProductSearch } from '@/features/catalog/containers/product-search'

import { MobileDock } from './mobile-dock'
import { useShellStore } from './shell-store'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { useShellShortcuts } from './use-shell-shortcuts'

export function AppLayout() {
  useShellShortcuts()
  const { openPanel, open, close } = useShellStore()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        onOpenSearch={() => open('search')}
        onOpenCategories={() => open('categories')}
        onOpenCart={() => open('cart')}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileDock
        searchOpen={openPanel === 'search'}
        categoriesOpen={openPanel === 'categories'}
        onOpenSearch={() => open('search')}
        onOpenCategories={() => open('categories')}
      />
      <ProductSearch open={openPanel === 'search'} onOpenChange={(isOpen) => (isOpen ? open('search') : close())} />
      <CategoriesMenu
        open={openPanel === 'categories'}
        onOpenChange={(isOpen) => (isOpen ? open('categories') : close())}
      />
      <CartDrawer open={openPanel === 'cart'} onOpenChange={(isOpen) => (isOpen ? open('cart') : close())} />
    </div>
  )
}
