import { parseAsInteger, useQueryState } from 'nuqs'

export function useOrdersPage() {
  return useQueryState('page', parseAsInteger.withDefault(1))
}
