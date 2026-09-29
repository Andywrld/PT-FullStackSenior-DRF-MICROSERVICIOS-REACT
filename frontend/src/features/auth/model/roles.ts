import type { Role } from './auth'

export const STAFF_ROLES: readonly Role[] = ['admin', 'super_admin']

export const ROLE_LABELS: Record<Role, string> = {
  user: 'Cliente',
  admin: 'Administrador',
  super_admin: 'Super administrador',
}
