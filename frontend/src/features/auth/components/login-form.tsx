import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { getErrorMessage } from '@/shared/api/error-messages'
import { PasswordField } from '@/shared/components/password-field'
import { TextField } from '@/shared/components/text-field'
import { Button } from '@/shared/ui/button'

import { type LoginFormValues, loginFormSchema } from '../model/auth'

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void
  isPending: boolean
  error: unknown
}

export function LoginForm({ onSubmit, isPending, error }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {Boolean(error) && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" size="lg" className="mt-2 h-11" disabled={isPending}>
        {isPending ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
