import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

import { UserForm } from '../components/user-form'
import { useCreateUser, useUpdateUser } from '../hooks/use-admin-users'
import { type AdminUser, EMPTY_USER_FORM, toUserForm, toUserUpdatePayload, type UserFormValues } from '../model/admin-user'

type UserFormDialogProps = {
  open: boolean
  user: AdminUser | null
  currentUserId: string | undefined
  onOpenChange: (open: boolean) => void
}

export function UserFormDialog({ open, user, currentUserId, onOpenChange }: UserFormDialogProps) {
  const create = useCreateUser()
  const update = useUpdateUser()
  const mutation = user ? update : create

  const close = () => {
    onOpenChange(false)
    create.reset()
    update.reset()
  }

  const submit = (values: UserFormValues) => {
    const onSuccess = () => {
      toast.success(user ? 'Usuario actualizado' : 'Usuario creado')
      close()
    }
    if (user) update.mutate({ userId: user.id, payload: toUserUpdatePayload(values) }, { onSuccess })
    else create.mutate(values, { onSuccess })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {user ? user.email : 'Podrá iniciar sesión con este email y contraseña.'}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          key={user?.id ?? 'new'}
          mode={user ? 'edit' : 'create'}
          isSelf={user !== null && user.id === currentUserId}
          defaultValues={user ? toUserForm(user) : EMPTY_USER_FORM}
          pending={mutation.isPending}
          error={mutation.error}
          onSubmit={submit}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  )
}
