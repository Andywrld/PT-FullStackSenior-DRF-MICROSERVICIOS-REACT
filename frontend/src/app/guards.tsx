import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useSession } from '@/features/auth/hooks/use-session'
import type { Role } from '@/features/auth/model/auth'
import { paths } from '@/shared/config/routes'
import { ForbiddenPage } from '@/shared/pages/forbidden-page'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession()
  const location = useLocation()

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${paths.login}?redirect=${redirect}`} replace />
  }
  return children
}

// The API enforces roles on every request; this only keeps the UI from showing what would fail.
export function RequireRole({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { user } = useSession()
  return (
    <RequireAuth>{user && roles.includes(user.role) ? children : <ForbiddenPage />}</RequireAuth>
  )
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession()
  return isAuthenticated ? <Navigate to={paths.products} replace /> : children
}
