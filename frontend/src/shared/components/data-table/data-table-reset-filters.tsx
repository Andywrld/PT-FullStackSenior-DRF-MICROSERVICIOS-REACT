import { XIcon } from 'lucide-react'

import { Button } from '@/shared/ui/button'

export function DataTableResetFilters({ visible, onReset }: { visible: boolean; onReset: () => void }) {
  if (!visible) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onReset}
      className="h-9 shrink-0 text-muted-foreground animate-in duration-(--duration-base) fade-in hover:text-foreground"
    >
      <XIcon />
      Limpiar
    </Button>
  )
}
