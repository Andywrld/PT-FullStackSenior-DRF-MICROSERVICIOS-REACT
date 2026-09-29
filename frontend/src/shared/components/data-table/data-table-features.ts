import { createColumnHelper, type RowData, rowSortingFeature, tableFeatures } from '@tanstack/react-table'

export type DataTableColumnMeta = {
  className?: string
}

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnMeta: {} as DataTableColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

/** Shrinks a column to its content, so the columns without it share the remaining width. */
export const FIT_COLUMN = 'w-px whitespace-nowrap'

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}
