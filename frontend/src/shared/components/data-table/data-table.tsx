import { type ColumnDef, functionalUpdate, type RowData, type SortingState, useTable } from '@tanstack/react-table'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

import { dataTableFeatures, type DataTableFeatures } from './data-table-features'

const NO_ROWS: never[] = []
const NO_SORTING: SortingState = []
const SKELETON_ROWS = 8

type DataTableProps<TData extends RowData> = {
  label: string
  columns: ColumnDef<DataTableFeatures, TData, any>[]
  data: TData[] | undefined
  getRowId: (row: TData) => string
  loading?: boolean
  refreshing?: boolean
  error?: ReactNode
  empty: ReactNode
  search?: ReactNode
  filters?: ReactNode
  footer?: ReactNode
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
}

/** Server-driven table: fills its container, keeps toolbar and header fixed and scrolls only the rows. */
export function DataTable<TData extends RowData>({
  label,
  columns,
  data,
  getRowId,
  loading,
  refreshing,
  error,
  empty,
  search,
  filters,
  footer,
  sorting = NO_SORTING,
  onSortingChange,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: data ?? NO_ROWS,
    getRowId: (row) => getRowId(row),
    manualSorting: true,
    enableMultiSort: false,
    enableSorting: Boolean(onSortingChange),
    state: { sorting },
    onSortingChange: (updater) => onSortingChange?.(functionalUpdate(updater, sorting)),
  })
  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length
  const showState = !loading && (error || rows.length === 0)

  return (
    <section aria-label={label} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
      {(search || filters) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b p-3">
          {search}
          {filters && <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">{filters}</div>}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain">
        {refreshing && <div aria-hidden className="absolute inset-x-0 top-0 z-20 h-0.5 animate-pulse bg-primary" />}
        <table className="w-full min-w-max border-separate border-spacing-0 text-sm" aria-busy={loading || refreshing}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      className={cn(
                        'h-11 border-b bg-card px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground',
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className={cn('transition-opacity duration-(--duration-fast)', refreshing && 'opacity-60')}>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                  <tr key={index}>
                    {Array.from({ length: columnCount }, (_, cell) => (
                      <td key={cell} className="border-b px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : !error &&
                rows.map((row) => (
                  <tr key={row.id} className="transition-colors duration-(--duration-fast) hover:bg-muted/50">
                    {row.getAllCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn('border-b px-4 py-3 align-middle', cell.column.columnDef.meta?.className)}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {showState && (
          <div
            role={error ? 'alert' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
          >
            {error ?? empty}
          </div>
        )}
      </div>

      {footer && <div className="shrink-0 border-t px-4 py-2.5">{footer}</div>}
    </section>
  )
}
