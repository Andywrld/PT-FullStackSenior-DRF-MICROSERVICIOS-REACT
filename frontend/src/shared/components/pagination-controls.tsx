import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { Pagination } from '@/shared/api/envelope'
import { Button } from '@/shared/ui/button'

type PaginationControlsProps = {
  pagination: Pagination
  onPageChange: (page: number) => void
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  if (pagination.total_pages <= 1) return null

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="icon"
        aria-label="Página anterior"
        disabled={!pagination.has_previous}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-24 text-center text-sm text-muted-foreground tabular-nums">
        Página {pagination.page} de {pagination.total_pages}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Página siguiente"
        disabled={!pagination.has_next}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  )
}
