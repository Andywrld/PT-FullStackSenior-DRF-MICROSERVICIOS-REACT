import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import type { Role } from '@/features/auth/model/auth'
import { getErrorMessage } from '@/shared/api/error-messages'
import { PasswordField } from '@/shared/components/password-field'
import { SelectField } from '@/shared/components/select-field'
import { TextField } from '@/shared/components/text-field'
import { useServerFieldErrors } from '@/shared/hooks/use-server-field-errors'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'

import {
  ROLE_OPTIONS,
  userCreateFormSchema,
  userEditFormSchema,
  type UserFormValues,
} from '../model/admin-user'

type UserFormProps = {
  mode: 'create' | 'edit'
  isSelf: boolean
  defaultValues: UserFormValues
  pending: boolean
  error: unknown
  onSubmit: (values: UserFormValues) => void
  onCancel: () => void
}

export function UserForm({ mode, isSelf, defaultValues, pending, error, onSubmit, onCancel }: UserFormProps) {
  const creating = mode === 'create'
  const form = useForm<UserFormValues>({
    resolver: zodResolver(creating ? userCreateFormSchema : userEditFormSchema),
    defaultValues,
  })
  const hasFieldErrors = useServerFieldErrors(form, error)
  const { errors } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {Boolean(error) && !hasFieldErrors && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}
      <TextField label="Nombre" autoFocus error={errors.full_name?.message} {...form.register('full_name')} />
      {creating && (
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="off"
          error={errors.email?.message}
          {...form.register('email')}
        />
      )}
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => (
          <SelectField
            label="Rol"
            required
            value={field.value}
            options={ROLE_OPTIONS}
            onChange={(role) => field.onChange(role as Role)}
            disabled={isSelf}
            hint={isSelf ? 'No puedes cambiar tu propio rol.' : undefined}
            error={errors.role?.message}
          />
        )}
      />
      <PasswordField
        label={creating ? 'Contraseña' : 'Nueva contraseña'}
        required={creating}
        autoComplete="new-password"
        hint={
          creating
            ? 'Mínimo 8 caracteres, no solo números.'
            : 'Déjala vacía para mantener la actual. Si la cambias, se cierran sus sesiones abiertas.'
        }
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <label
            className={
              isSelf
                ? 'flex items-center justify-between gap-4 rounded-xl border p-4 opacity-60'
                : 'flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4'
            }
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Cuenta activa</span>
              <span className="text-sm text-muted-foreground">
                {isSelf
                  ? 'No puedes desactivar tu propia cuenta.'
                  : 'Si la desactivas, no podrá iniciar sesión y se cierran sus sesiones.'}
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSelf} />
          </label>
        )}
      />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : creating ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
