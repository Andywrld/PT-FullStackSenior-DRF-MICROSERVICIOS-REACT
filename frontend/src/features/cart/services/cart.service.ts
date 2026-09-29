import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/api'

import { cartSchema } from '../model/cart'

export function fetchCart() {
  return apiGet('/cart/', cartSchema)
}

export function addCartItem(productId: string, quantity: number) {
  return apiPost('/cart/items/', cartSchema, { product_id: productId, quantity })
}

export function updateCartItem(productId: string, quantity: number) {
  return apiPatch(`/cart/items/${productId}/`, cartSchema, { quantity })
}

export function removeCartItem(productId: string) {
  return apiDelete(`/cart/items/${productId}/`, cartSchema)
}

export function clearCart() {
  return apiDelete('/cart/items/', cartSchema)
}
