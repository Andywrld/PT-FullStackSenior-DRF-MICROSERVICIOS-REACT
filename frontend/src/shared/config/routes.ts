export const paths = {
  home: '/',
  products: '/productos',
  product: (productId: string) => `/productos/${productId}`,
  cart: '/carrito',
  login: '/ingresar',
  register: '/registro',
  account: '/cuenta',
  orders: '/ordenes',
  order: (orderId: string) => `/ordenes/${orderId}`,
  admin: {
    root: '/admin',
    products: '/admin/productos',
    categories: '/admin/categorias',
    orders: '/admin/ordenes',
    users: '/admin/usuarios',
  },
} as const
