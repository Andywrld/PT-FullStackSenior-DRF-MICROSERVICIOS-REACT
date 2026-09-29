import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  /** When set, the minus button becomes "remove" at the minimum. */
  onRemove?: () => void
  min?: number
  max: number
  disabled?: boolean
  size?: 'sm' | 'default'
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  onRemove,
  min = 1,
  max,
  disabled,
  size = 'default',
  className,
}: QuantityStepperProps) {
  const buttonSize = size === 'sm' ? 'icon-xs' : 'icon-sm'
  const removes = Boolean(onRemove) && value <= min

  return (
    <div
      role="group"
      aria-label="Cantidad"
      className={cn('inline-flex items-center justify-between gap-1 rounded-lg border p-0.5', className)}
    >
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        aria-label={removes ? 'Quitar del carrito' : 'Disminuir cantidad'}
        disabled={disabled || (!removes && value <= min)}
        onClick={() => (removes ? onRemove?.() : onChange(value - 1))}
        className={cn(removes && 'text-muted-foreground hover:text-destructive')}
      >
        {removes ? <Trash2Icon /> : <MinusIcon />}
      </Button>
      <span
        aria-live="polite"
        className={cn('min-w-8 text-center font-medium tabular-nums', size === 'sm' ? 'text-xs' : 'text-sm')}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        aria-label="Aumentar cantidad"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
