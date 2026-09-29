import { useNavigate } from 'react-router'

import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { paths } from '@/shared/config/routes'

import { useLogout } from '../hooks/use-auth-mutations'

type LogoutConfirmProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutConfirm({ open, onOpenChange }: LogoutConfirmProps) {
  const logout = useLogout()
  const navigate = useNavigate()

  const confirm = async () => {
    // Not mutate() callbacks: ending the session unmounts the opener, and React Query
    // skips callbacks of unmounted components (the dialog reopened on the next login).
    await logout.mutateAsync()
    onOpenChange(false)
    navigate(paths.products, { replace: true })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Cerrar sesión?"
      description="Tu carrito queda guardado en tu cuenta para la próxima vez."
      confirmLabel={logout.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
      pending={logout.isPending}
      onConfirm={confirm}
    />
  )
}
