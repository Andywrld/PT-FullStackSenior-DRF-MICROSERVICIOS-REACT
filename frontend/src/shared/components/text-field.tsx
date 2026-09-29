import { type ComponentProps, useId } from 'react'

import { fieldMessageId } from '@/shared/lib/field-message-id'
import { Input } from '@/shared/ui/input'

import { FormField } from './form-field'

type TextFieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, required, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FormField id={inputId} label={label} required={required} error={error} hint={hint}>
      <Input
        id={inputId}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? fieldMessageId(inputId) : undefined}
        className="h-10"
        {...props}
      />
    </FormField>
  )
}
