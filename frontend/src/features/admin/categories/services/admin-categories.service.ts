import { z } from 'zod'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/api'

import { isActiveParam } from '../../model/active-status'
import { type AdminCategoriesQuery, adminCategorySchema, type CategoryFormValues } from '../model/admin-category'

export const ADMIN_CATEGORIES_PAGE_SIZE = 20

export function fetchAdminCategories({ page, search, status, ordering }: AdminCategoriesQuery) {
  return apiGet('/categories/', z.array(adminCategorySchema), {
    page,
    page_size: ADMIN_CATEGORIES_PAGE_SIZE,
    search: search || undefined,
    is_active: isActiveParam(status),
    ordering,
  })
}

export function createCategory(values: CategoryFormValues) {
  return apiPost('/categories/', adminCategorySchema, values)
}

export function updateCategory(categoryId: string, values: CategoryFormValues) {
  return apiPatch(`/categories/${categoryId}/`, adminCategorySchema, values)
}

export function deleteCategory(categoryId: string) {
  return apiDelete(`/categories/${categoryId}/`, z.null())
}
