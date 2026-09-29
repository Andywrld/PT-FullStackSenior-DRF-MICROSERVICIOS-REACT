import { z } from 'zod'

import { newPasswordSchema, type Role, roleSchema, type User } from '@/features/auth/model/auth'
import { ROLE_LABELS } from '@/features/auth/model/roles'

import type { ActiveStatus } from '../../model/active-status'

export type AdminUser = User

export type AdminUsersQuery = {
  page: number
  search: string
  role?: Role
  status?: ActiveStatus
  ordering?: string
}

export const ROLE_OPTIONS = roleSchema.options.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

const profileFields = {
  full_name: z.string().trim().max(150, 'Máximo 150 caracteres.'),
  role: roleSchema,
  is_active: z.boolean(),
}

// Same shape in both modes, so one form serves both; only the rules change.
export const userCreateFormSchema = z.object({
  ...profileFields,
  email: z.email('Ingresa un email válido.'),
  password: newPasswordSchema,
})

export const userEditFormSchema = z.object({
  ...profileFields,
  email: z.string(),
  password: z.union([z.literal(''), newPasswordSchema]),
})

export type UserFormValues = z.infer<typeof userCreateFormSchema>

export const EMPTY_USER_FORM: UserFormValues = {
  email: '',
  full_name: '',
  role: 'user',
  is_active: true,
  password: '',
}

export function toUserForm(user: AdminUser): UserFormValues {
  return { email: user.email, full_name: user.full_name, role: user.role, is_active: user.is_active, password: '' }
}

export function toUserUpdatePayload({ full_name, role, is_active, password }: UserFormValues) {
  return { full_name, role, is_active, ...(password ? { password } : {}) }
}

export type UserUpdatePayload = ReturnType<typeof toUserUpdatePayload>
