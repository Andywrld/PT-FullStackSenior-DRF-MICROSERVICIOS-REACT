import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from '@/shared/ui/select'

export type FilterOption = { value: string; label: string }

type DataTableSelectFilterProps = {
  label: string
  allLabel: string
  icon: LucideIcon
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
}

export function DataTableSelectFilter({ label, allLabel, icon: Icon, value, options, onChange }: DataTableSelectFilterProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <Select items={[{ value: null, label: allLabel }, ...options]} value={value} onValueChange={(next) => onChange(next)}>
      <SelectTrigger
        aria-label={`Filtrar por ${label.toLowerCase()}`}
        className={cn(
          'min-w-0 flex-1 sm:w-auto sm:min-w-40 sm:flex-none',
          selected && 'border-primary/40 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className={cn('transition-colors', selected ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn('truncate', !selected && 'text-foreground/80')}>{selected?.label ?? label}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{allLabel}</SelectItem>
        <SelectSeparator />
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
