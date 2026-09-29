import type { ReactNode } from 'react'

import { fieldMessageId } from '@/shared/lib/field-message-id'

type FormFieldProps = {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({ id, label, required, error, hint, children }: FormFieldProps) {
  const message = error ?? hint

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {/* Decorative: the control itself carries aria-required for screen readers. */}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </label>
      {children}
      {message && (
        <p id={fieldMessageId(id)} className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {message}
        </p>
      )}
    </div>
  )
}
