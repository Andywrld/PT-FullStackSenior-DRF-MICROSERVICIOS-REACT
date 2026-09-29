import type { CellData, Column, RowData } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'

import type { DataTableFeatures } from './data-table-features'

type DataTableColumnHeaderProps<TData extends RowData, TValue extends CellData> = {
  column: Column<DataTableFeatures, TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData extends RowData, TValue extends CellData>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) return title

  const sorted = column.getIsSorted()
  const Icon = sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : ChevronsUpDownIcon

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="-mx-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none data-[sorted=true]:text-foreground"
      data-sorted={Boolean(sorted)}
    >
      {title}
      <Icon className="size-3.5" aria-hidden />
    </button>
  )
}
