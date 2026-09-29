import { ChevronRightIcon, LayoutDashboardIcon, LogOutIcon, ReceiptTextIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { paths } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'

import { UserAvatar } from '../components/user-avatar'
import { LogoutConfirm } from '../containers/logout-confirm'
import { useSession } from '../hooks/use-session'
import { ROLE_LABELS } from '../model/roles'

export function AccountPage() {
  const { user, isAdmin } = useSession()
  const [confirmLogout, setConfirmLogout] = useState(false)

  if (!user) return null

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Mi cuenta</h1>
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-6">
        <UserAvatar className="size-14" />
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-medium">{user.full_name || 'Sin nombre'}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
      </div>
      <Link
        to={paths.orders}
        className="group flex items-center gap-4 rounded-2xl border p-5 transition-colors duration-(--duration-fast) hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ReceiptTextIcon className="size-5" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="font-medium">Mis órdenes</span>
          <span className="text-sm text-muted-foreground">Revisa tus compras y su detalle</span>
        </span>
        <ChevronRightIcon className="size-4 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
      </Link>
      {isAdmin && (
        <Link
          to={paths.admin.root}
          className="group flex items-center gap-4 rounded-2xl border p-5 transition-colors duration-(--duration-fast) hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LayoutDashboardIcon className="size-5" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="font-medium">Administración</span>
            <span className="text-sm text-muted-foreground">Productos, categorías, órdenes y usuarios</span>
          </span>
          <ChevronRightIcon className="size-4 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
        </Link>
      )}
      <Button variant="outline" className="self-start" onClick={() => setConfirmLogout(true)}>
        <LogOutIcon />
        Cerrar sesión
      </Button>
      <LogoutConfirm open={confirmLogout} onOpenChange={setConfirmLogout} />
    </section>
  )
}
