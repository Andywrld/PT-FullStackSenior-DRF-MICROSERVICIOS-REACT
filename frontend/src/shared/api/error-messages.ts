import { isApiError } from './api-error'

const FALLBACK = 'Ocurrió un error inesperado. Inténtalo de nuevo.'

// Backend messages are for developers; the UI translates the stable `error.code`.
const MESSAGES: Record<string, string> = {
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión.',
  timeout: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
  invalid_response: 'Recibimos una respuesta inesperada del servidor.',
  unexpected_response: FALLBACK,
  internal_error: FALLBACK,
  service_unavailable: 'El servicio no está disponible en este momento. Inténtalo en unos segundos.',
  too_many_requests: 'Demasiados intentos seguidos. Espera un momento.',
  payload_too_large: 'El archivo es demasiado grande.',
  not_found: 'No encontramos lo que buscas.',
  validation_error: 'Revisa los datos ingresados.',
  not_authenticated: 'Inicia sesión para continuar.',
  invalid_token: 'Tu sesión expiró. Inicia sesión de nuevo.',
  token_expired: 'Tu sesión expiró. Inicia sesión de nuevo.',
  permission_denied: 'No tienes permiso para realizar esta acción.',
  invalid_credentials: 'El email o la contraseña son incorrectos.',
  product_not_available: 'Este producto ya no está disponible.',
  insufficient_stock: 'No hay stock suficiente para esa cantidad.',
  empty_cart: 'Tu carrito está vacío.',
  unavailable_items: 'Algunos productos de tu carrito ya no están disponibles.',
  cart_item_not_found: 'Ese producto ya no está en tu carrito.',
  category_in_use: 'La categoría tiene productos y no se puede eliminar.',
}

export function getErrorMessage(error: unknown): string {
  return isApiError(error) ? (MESSAGES[error.code] ?? FALLBACK) : FALLBACK
}
