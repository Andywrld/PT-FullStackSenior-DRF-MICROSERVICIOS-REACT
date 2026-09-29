import type { AdminCategoriesQuery } from '../categories/model/admin-category'
import type { AdminOrdersQuery } from '../orders/services/admin-orders.service'
import type { AdminProductsQuery } from '../products/model/admin-product'
import type { AdminUsersQuery } from '../users/model/admin-user'

export const adminProductKeys = {
  all: ['admin', 'products'] as const,
  list: (query: AdminProductsQuery) => [...adminProductKeys.all, 'list', query] as const,
  detail: (productId: string) => [...adminProductKeys.all, 'detail', productId] as const,
}

export const adminCategoryKeys = {
  all: ['admin', 'categories'] as const,
  list: (query: AdminCategoriesQuery) => [...adminCategoryKeys.all, 'list', query] as const,
}

export const adminOrderKeys = {
  all: ['admin', 'orders'] as const,
  list: (query: AdminOrdersQuery) => [...adminOrderKeys.all, 'list', query] as const,
}

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (query: AdminUsersQuery) => [...adminUserKeys.all, 'list', query] as const,
}
