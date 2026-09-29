import { parseAsString, useQueryState } from 'nuqs'
import { Link, useNavigate } from 'react-router'

import { paths } from '@/shared/config/routes'
import { safeRedirect } from '@/shared/lib/safe-redirect'

import { AuthShell } from '../components/auth-shell'
import { RegisterForm } from '../components/register-form'
import { useRegister } from '../hooks/use-auth-mutations'

export function RegisterPage() {
  const [redirect] = useQueryState('redirect', parseAsString)
  const navigate = useNavigate()
  const registration = useRegister()

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Sin verificaciones: empiezas a comprar al instante."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to={redirect ? `${paths.login}?redirect=${encodeURIComponent(redirect)}` : paths.login}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm
        isPending={registration.isPending}
        error={registration.error}
        onSubmit={({ full_name, email, password }) =>
          registration.mutate(
            { full_name, email, password },
            { onSuccess: () => navigate(safeRedirect(redirect, paths.products), { replace: true }) },
          )
        }
      />
    </AuthShell>
  )
}
