import { useEffect } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

import { isApiError } from '@/shared/api/api-error'

function matchingFields<T extends FieldValues>(form: UseFormReturn<T>, error: unknown) {
  if (!isApiError(error)) return []
  const values = form.getValues()
  return Object.entries(error.fieldErrors).filter(([field]) => field in values)
}

export function useServerFieldErrors<T extends FieldValues>(form: UseFormReturn<T>, error: unknown): boolean {
  useEffect(() => {
    for (const [field, messages] of matchingFields(form, error)) {
      form.setError(field as Path<T>, { type: 'server', message: messages[0] })
    }
  }, [error, form])

  return matchingFields(form, error).length > 0
}
