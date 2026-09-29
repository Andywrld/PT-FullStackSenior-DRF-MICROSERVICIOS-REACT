import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { getErrorMessage } from '@/shared/api/error-messages'
import { PasswordField } from '@/shared/components/password-field'
import { TextField } from '@/shared/components/text-field'
import { useServerFieldErrors } from '@/shared/hooks/use-server-field-errors'
import { Button } from '@/shared/ui/button'

import { type RegisterFormValues, registerFormSchema } from '../model/auth'

type RegisterFormProps = {
  onSubmit: (values: RegisterFormValues) => void
  isPending: boolean
  error: unknown
}

export function RegisterForm({ onSubmit, isPending, error }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  })
  const { errors } = form.formState
  const shownOnFields = useServerFieldErrors(form, error)

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {Boolean(error) && !shownOnFields && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}
      <TextField
        label="Nombre (opcional)"
        autoComplete="name"
        error={errors.full_name?.message}
        {...form.register('full_name')}
      />
      <TextField
        label="Email"
        type="email"
        required
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        label="Contraseña"
        required
        autoComplete="new-password"
        hint="Al menos 8 caracteres, no solo números."
        error={errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        label="Repite la contraseña"
        required
        autoComplete="new-password"
        error={errors.confirm_password?.message}
        {...form.register('confirm_password')}
      />
      <p className="text-xs text-muted-foreground">
        Los campos con <span className="text-destructive">*</span> son obligatorios.
      </p>
      <Button type="submit" size="lg" className="h-11" disabled={isPending}>
        {isPending ? 'Creando tu cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  )
}
