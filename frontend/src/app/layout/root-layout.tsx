import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { Outlet } from 'react-router'

import { Toaster } from '@/shared/components/toaster'
import { useThemeClass } from '@/shared/hooks/use-theme-class'

export function RootLayout() {
  useThemeClass()

  return (
    // nuqs' React Router adapter uses router hooks, so it lives inside the router.
    <NuqsAdapter>
      <Outlet />
      <Toaster />
    </NuqsAdapter>
  )
}
