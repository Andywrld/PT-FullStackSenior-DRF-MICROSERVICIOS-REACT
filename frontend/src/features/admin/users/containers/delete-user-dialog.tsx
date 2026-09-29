import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'

import { useDeleteUser } from '../hooks/use-admin-users'
import type { AdminUser } from '../model/admin-user'

type DeleteUserDialogProps = {
  open: boolean
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({ open, user, onOpenChange }: DeleteUserDialogProps) {
  const remove = useDeleteUser()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`¿Eliminar la cuenta de ${user?.full_name || user?.email || ''}?`}
      description="Perderá el acceso de inmediato. Sus órdenes se conservan. Si solo quieres bloquearla, desactívala."
      confirmLabel={remove.isPending ? 'Eliminando…' : 'Eliminar'}
      destructive
      pending={remove.isPending}
      onConfirm={() => {
        if (!user) return
        remove.mutate(user.id, {
          onSuccess: () => toast.success('Usuario eliminado'),
          onError: (error) => toast.error(getErrorMessage(error)),
          onSettled: () => onOpenChange(false),
        })
      }}
    />
  )
}
