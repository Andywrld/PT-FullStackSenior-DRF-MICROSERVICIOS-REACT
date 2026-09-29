import { LogOutIcon, StoreIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router'

import { UserAvatar } from '@/features/auth/components/user-avatar'
import { LogoutConfirm } from '@/features/auth/containers/logout-confirm'
import type { User } from '@/features/auth/model/auth'
import { ROLE_LABELS } from '@/features/auth/model/roles'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { paths } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

import { ADMIN_NAV } from './admin-nav'

const itemClass =
  'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-(--duration-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&_svg]:size-4.5 [&_svg]:shrink-0'

type AdminSidebarProps = {
  user: User
  onNavigate?: () => void
}

export function AdminSidebar({ user, onNavigate }: AdminSidebarProps) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const items = ADMIN_NAV.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to={paths.admin.root} onClick={onNavigate} className="flex flex-col px-3 pt-2">
        <span className="font-heading text-2xl">Marketplace</span>
        <span className="text-xs text-muted-foreground">Administración</span>
      </Link>

      <nav aria-label="Administración" className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon, ready }) =>
          ready ? (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  itemClass,
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon />
              {label}
            </NavLink>
          ) : (
            <span key={to} aria-disabled="true" className={cn(itemClass, 'cursor-default text-muted-foreground/60')}>
              <Icon />
              {label}
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                Pronto
              </span>
            </span>
          ),
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          to={paths.products}
          onClick={onNavigate}
          className={cn(itemClass, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          <StoreIcon />
          Ver tienda
        </Link>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <UserAvatar className="size-9" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{user.full_name || user.email}</span>
            <span className="truncate text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </div>
          <ThemeToggle />
        </div>
        <Button variant="outline" onClick={() => setConfirmLogout(true)}>
          <LogOutIcon />
          Cerrar sesión
        </Button>
      </div>
      <LogoutConfirm open={confirmLogout} onOpenChange={setConfirmLogout} />
    </div>
  )
}
