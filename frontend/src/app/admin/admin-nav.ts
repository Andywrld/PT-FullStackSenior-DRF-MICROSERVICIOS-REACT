import { type LucideIcon, PackageIcon, ReceiptTextIcon, TagsIcon, UsersIcon } from 'lucide-react'

import type { Role } from '@/features/auth/model/auth'
import { STAFF_ROLES } from '@/features/auth/model/roles'
import { paths } from '@/shared/config/routes'

export type AdminNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: readonly Role[]
  ready: boolean
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: paths.admin.products, label: 'Productos', icon: PackageIcon, roles: STAFF_ROLES, ready: true },
  { to: paths.admin.categories, label: 'Categorías', icon: TagsIcon, roles: STAFF_ROLES, ready: true },
  { to: paths.admin.orders, label: 'Órdenes', icon: ReceiptTextIcon, roles: STAFF_ROLES, ready: true },
  // The auth service lets only a super admin manage accounts.
  { to: paths.admin.users, label: 'Usuarios', icon: UsersIcon, roles: ['super_admin'], ready: true },
]
