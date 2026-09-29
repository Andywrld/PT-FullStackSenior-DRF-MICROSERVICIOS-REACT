import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { Pagination } from '@/shared/api/envelope'
import { Button } from '@/shared/ui/button'

type DataTablePaginationProps = {
  pagination: Pagination
  onPageChange: (page: number) => void
}

export function DataTablePagination({ pagination, onPageChange }: DataTablePaginationProps) {
  const { page, page_size, total_items, total_pages } = pagination
  const from = total_items === 0 ? 0 : (page - 1) * page_size + 1
  const to = Math.min(page * page_size, total_items)

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4 text-sm">
      <p className="text-muted-foreground tabular-nums">
        {total_items === 0 ? 'Sin resultados' : `${from}–${to} de ${total_items}`}
      </p>
      <div className="flex items-center gap-2">
        <span className="hidden text-muted-foreground tabular-nums sm:inline">
          Página {page} de {Math.max(total_pages, 1)}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página anterior"
          disabled={!pagination.has_previous}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página siguiente"
          disabled={!pagination.has_next}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
