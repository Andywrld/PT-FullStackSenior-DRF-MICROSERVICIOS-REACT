import { cn } from '@/shared/lib/utils'

import type { Category } from '../model/product'

type CategoryFilterListProps = {
  categories: Category[]
  selected: string | null
  onSelect: (categoryId: string | null) => void
}

const OPTION =
  'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'

export function CategoryFilterList({ categories, selected, onSelect }: CategoryFilterListProps) {
  const total = categories.reduce((sum, category) => sum + category.product_count, 0)

  return (
    <ul className="flex flex-col gap-0.5">
      <li>
        <button
          type="button"
          aria-pressed={!selected}
          onClick={() => onSelect(null)}
          className={cn(OPTION, !selected && 'bg-accent font-medium text-accent-foreground')}
        >
          Todas
          <span className="text-xs text-muted-foreground tabular-nums">{total}</span>
        </button>
      </li>
      {categories.map((category) => {
        const active = selected === category.id
        return (
          <li key={category.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(category.id)}
              className={cn(OPTION, active && 'bg-accent font-medium text-accent-foreground')}
            >
              {category.name}
              <span className="text-xs text-muted-foreground tabular-nums">{category.product_count}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
