import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router'

import { useSession } from '@/features/auth/hooks/use-session'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { TooltipProvider } from '@/shared/ui/tooltip'

import { AdminSidebar } from './admin-sidebar'

export function AdminLayout() {
  const { user } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  return (
    <TooltipProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <aside className="hidden w-68 shrink-0 border-r bg-surface lg:block">
          <AdminSidebar user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}>
              <MenuIcon />
            </Button>
            <span className="font-heading text-xl">Administración</span>
          </header>
          <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menú de administración</SheetTitle>
            <AdminSidebar user={user} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
