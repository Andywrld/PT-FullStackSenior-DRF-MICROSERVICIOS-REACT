import type { SortingState } from '@tanstack/react-table'

// The backend sorts with DRF's `?ordering=` ("price", "-created_at"); the table speaks SortingState.

export function orderingToSorting(ordering: string): SortingState {
  if (!ordering) return []
  const desc = ordering.startsWith('-')
  return [{ id: desc ? ordering.slice(1) : ordering, desc }]
}

export function sortingToOrdering(sorting: SortingState): string | null {
  const [first] = sorting
  if (!first) return null
  return first.desc ? `-${first.id}` : first.id
}
