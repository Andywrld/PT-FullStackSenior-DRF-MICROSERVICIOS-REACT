import { STAFF_ROLES } from '../model/roles'
import { useSessionStore } from '../store/session-store'

/** A persisted refresh token is enough to count as signed in. */
export function useSession() {
  const user = useSessionStore((state) => state.user)
  const refreshToken = useSessionStore((state) => state.refreshToken)
  return {
    user,
    isAuthenticated: Boolean(user && refreshToken),
    isAdmin: user ? STAFF_ROLES.includes(user.role) : false,
  }
}
