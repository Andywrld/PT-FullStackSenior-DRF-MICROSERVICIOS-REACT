import { parseAsString, useQueryState } from 'nuqs'
import { Link, useNavigate } from 'react-router'

import { paths } from '@/shared/config/routes'
import { safeRedirect } from '@/shared/lib/safe-redirect'

import { AuthShell } from '../components/auth-shell'
import { LoginForm } from '../components/login-form'
import { useLogin } from '../hooks/use-auth-mutations'

export function LoginPage() {
  const [redirect] = useQueryState('redirect', parseAsString)
  const navigate = useNavigate()
  const login = useLogin()

  return (
    <AuthShell
      title="Hola de nuevo"
      subtitle="Ingresa con tu email y contraseña."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link
            to={redirect ? `${paths.register}?redirect=${encodeURIComponent(redirect)}` : paths.register}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Créala en un minuto
          </Link>
        </>
      }
    >
      <LoginForm
        isPending={login.isPending}
        error={login.error}
        onSubmit={(values) =>
          login.mutate(values, {
            onSuccess: () => navigate(safeRedirect(redirect, paths.products), { replace: true }),
          })
        }
      />
    </AuthShell>
  )
}
