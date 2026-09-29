import { LayoutDashboardIcon, LogOutIcon, ReceiptTextIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { UserAvatar } from '@/features/auth/components/user-avatar'
import { LogoutConfirm } from '@/features/auth/containers/logout-confirm'
import { useSession } from '@/features/auth/hooks/use-session'
import type { User } from '@/features/auth/model/auth'
import { paths } from '@/shared/config/routes'
import { buttonVariants } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

export function AccountMenu() {
  const { user } = useSession()

  if (!user) {
    return (
      <Link to={paths.login} className={buttonVariants({ size: 'sm' })}>
        Iniciar sesión
      </Link>
    )
  }
  // Separate component: its state dies with the session instead of leaking into the next login.
  return <UserMenu user={user} />
}

function UserMenu({ user }: { user: User }) {
  const navigate = useNavigate()
  const { isAdmin } = useSession()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Menú de la cuenta"
          className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <UserAvatar className="size-8" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="truncate text-sm font-medium text-foreground">{user.full_name || 'Mi cuenta'}</span>
              <span className="truncate font-normal">{user.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(paths.account)}>
            <UserIcon />
            Mi cuenta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(paths.orders)}>
            <ReceiptTextIcon />
            Mis órdenes
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate(paths.admin.root)}>
              <LayoutDashboardIcon />
              Administración
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmLogout(true)}>
            <LogOutIcon />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutConfirm open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  )
}
