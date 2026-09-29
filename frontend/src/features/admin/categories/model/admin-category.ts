import { z } from 'zod'

import { categorySchema } from '@/features/catalog/model/product'

import type { ActiveStatus } from '../../model/active-status'

export const adminCategorySchema = categorySchema.extend({
  created_at: z.string(),
  updated_at: z.string(),
})

export type AdminCategory = z.infer<typeof adminCategorySchema>

export type AdminCategoriesQuery = {
  page: number
  search: string
  status?: ActiveStatus
  ordering?: string
}

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa un nombre.').max(100, 'Máximo 100 caracteres.'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres.'),
  is_active: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const EMPTY_CATEGORY_FORM: CategoryFormValues = { name: '', description: '', is_active: true }

export function toCategoryForm(category: AdminCategory): CategoryFormValues {
  return { name: category.name, description: category.description, is_active: category.is_active }
}
