import { Toaster as Sonner } from 'sonner'

import { useThemeStore } from '@/shared/store/theme-store'

export function Toaster() {
  const theme = useThemeStore((state) => state.theme)
  return (
    <Sonner
      theme={theme}
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans !rounded-xl !border-border !bg-popover !text-popover-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
        },
      }}
    />
  )
}
