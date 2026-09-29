import { createBrowserRouter, Navigate } from 'react-router'

import { AdminCategoriesPage } from '@/features/admin/categories/pages/admin-categories-page'
import { AdminOrdersPage } from '@/features/admin/orders/pages/admin-orders-page'
import { AdminProductsPage } from '@/features/admin/products/pages/admin-products-page'
import { AdminUsersPage } from '@/features/admin/users/pages/admin-users-page'
import { STAFF_ROLES } from '@/features/auth/model/roles'
import { AccountPage } from '@/features/auth/pages/account-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { CartPage } from '@/features/cart/pages/cart-page'
import { ProductPage } from '@/features/catalog/pages/product-page'
import { ProductsPage } from '@/features/catalog/pages/products-page'
import { OrderPage } from '@/features/orders/pages/order-page'
import { OrdersPage } from '@/features/orders/pages/orders-page'
import { paths } from '@/shared/config/routes'
import { NotFoundPage } from '@/shared/pages/not-found-page'

import { AdminLayout } from './admin/admin-layout'
import { GuestOnly, RequireAuth, RequireRole } from './guards'
import { AppLayout } from './layout/app-layout'
import { RootLayout } from './layout/root-layout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={paths.products} replace /> },
          { path: 'productos', element: <ProductsPage /> },
          { path: 'productos/:productId', element: <ProductPage /> },
          {
            path: 'ingresar',
            element: (
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            ),
          },
          {
            path: 'registro',
            element: (
              <GuestOnly>
                <RegisterPage />
              </GuestOnly>
            ),
          },
          {
            path: 'carrito',
            element: (
              <RequireAuth>
                <CartPage />
              </RequireAuth>
            ),
          },
          {
            path: 'cuenta',
            element: (
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            ),
          },
          {
            path: 'ordenes',
            element: (
              <RequireAuth>
                <OrdersPage />
              </RequireAuth>
            ),
          },
          {
            path: 'ordenes/:orderId',
            element: (
              <RequireAuth>
                <OrderPage />
              </RequireAuth>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <RequireRole roles={STAFF_ROLES}>
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to={paths.admin.products} replace /> },
          { path: 'productos', element: <AdminProductsPage /> },
          { path: 'categorias', element: <AdminCategoriesPage /> },
          { path: 'ordenes', element: <AdminOrdersPage /> },
          {
            path: 'usuarios',
            element: (
              <RequireRole roles={['super_admin']}>
                <AdminUsersPage />
              </RequireRole>
            ),
          },
          { path: '*', element: <Navigate to={paths.admin.products} replace /> },
        ],
      },
    ],
  },
])
