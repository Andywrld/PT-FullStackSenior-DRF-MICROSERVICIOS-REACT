import { QueryClient } from '@tanstack/react-query'

import { type ApiError, isApiError } from '@/shared/api/api-error'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false
        return failureCount < MAX_RETRIES
      },
    },
  },
})
