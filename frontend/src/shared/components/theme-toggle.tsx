import { MoonIcon, SunIcon } from 'lucide-react'

import { useThemeStore } from '@/shared/store/theme-store'
import { Button } from '@/shared/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isLight = theme === 'light'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isLight ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {isLight ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}
