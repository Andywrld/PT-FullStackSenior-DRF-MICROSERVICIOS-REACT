import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { catalogKeys } from '@/features/catalog/hooks/catalog-keys'

import { adminCategoryKeys, adminProductKeys } from '../../hooks/admin-query-keys'
import type { AdminProductsQuery, ProductPayload } from '../model/admin-product'
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  fetchAdminProduct,
  fetchAdminProducts,
  updateProduct,
  uploadProductImage,
} from '../services/admin-products.service'

export function useAdminProducts(query: AdminProductsQuery) {
  return useQuery({
    queryKey: adminProductKeys.list(query),
    queryFn: () => fetchAdminProducts(query),
    placeholderData: keepPreviousData,
  })
}

export function useAdminProduct(productId: string | null) {
  return useQuery({
    queryKey: adminProductKeys.detail(productId ?? ''),
    queryFn: productId ? () => fetchAdminProduct(productId) : skipToken,
  })
}

// A product change also moves the storefront and the categories' product counts.
function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [adminProductKeys.all, adminCategoryKeys.all, catalogKeys.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({ mutationFn: (payload: ProductPayload) => createProduct(payload), onSuccess: invalidate })
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: ProductPayload }) =>
      updateProduct(productId, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({ mutationFn: (productId: string) => deleteProduct(productId), onSuccess: invalidate })
}

export function useUploadProductImage() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) => uploadProductImage(productId, file),
    onSuccess: invalidate,
  })
}

export function useDeleteProductImage(productId: string) {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(productId, imageId),
    onSuccess: invalidate,
  })
}
