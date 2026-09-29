import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { catalogKeys } from '@/features/catalog/hooks/catalog-keys'

import { adminCategoryKeys, adminProductKeys } from '../../hooks/admin-query-keys'
import type { AdminCategoriesQuery, CategoryFormValues } from '../model/admin-category'
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from '../services/admin-categories.service'

export function useAdminCategories(query: AdminCategoriesQuery) {
  return useQuery({
    queryKey: adminCategoryKeys.list(query),
    queryFn: () => fetchAdminCategories(query),
    placeholderData: keepPreviousData,
  })
}

// Categories show up in the storefront and in the products table too.
function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [adminCategoryKeys.all, adminProductKeys.all, catalogKeys.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (values: CategoryFormValues) => createCategory(values),
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ categoryId, values }: { categoryId: string; values: CategoryFormValues }) =>
      updateCategory(categoryId, values),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: invalidate,
  })
}
