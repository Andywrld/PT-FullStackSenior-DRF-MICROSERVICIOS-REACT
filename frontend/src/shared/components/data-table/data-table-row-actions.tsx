import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

export type RowAction = {
  label: string
  icon: LucideIcon
  onClick: () => void
  destructive?: boolean
}

export function DataTableRowActions({ actions }: { actions: RowAction[] }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {actions.map(({ label, icon: Icon, onClick, destructive }) => (
        <Tooltip key={label}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                onClick={onClick}
                className={cn(
                  'text-muted-foreground',
                  destructive ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:text-foreground',
                )}
              />
            }
          >
            <Icon />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
