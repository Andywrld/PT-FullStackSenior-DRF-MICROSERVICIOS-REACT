import { z } from 'zod'

import { userSchema } from '@/features/auth/model/auth'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/api'

import { isActiveParam } from '../../model/active-status'
import type { AdminUsersQuery, UserFormValues, UserUpdatePayload } from '../model/admin-user'

export const ADMIN_USERS_PAGE_SIZE = 20

export function fetchAdminUsers({ page, search, role, status, ordering }: AdminUsersQuery) {
  return apiGet('/auth/users/', z.array(userSchema), {
    page,
    page_size: ADMIN_USERS_PAGE_SIZE,
    search: search || undefined,
    role,
    is_active: isActiveParam(status),
    ordering,
  })
}

export function createUser(values: UserFormValues) {
  return apiPost('/auth/users/', userSchema, values)
}

export function updateUser(userId: string, payload: UserUpdatePayload) {
  return apiPatch(`/auth/users/${userId}/`, userSchema, payload)
}

export function deleteUser(userId: string) {
  return apiDelete(`/auth/users/${userId}/`, z.null())
}
