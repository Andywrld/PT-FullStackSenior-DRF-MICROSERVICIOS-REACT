import { useId } from 'react'

import { fieldMessageId } from '@/shared/lib/field-message-id'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { FormField } from './form-field'

type SelectFieldProps = {
  label: string
  value: string | null
  options: { value: string | null; label: string }[]
  onChange: (value: string | null) => void
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
}

export function SelectField({ label, value, options, onChange, error, hint, required, disabled }: SelectFieldProps) {
  const id = useId()

  return (
    <FormField id={id} label={label} required={required} error={error} hint={hint}>
      <Select items={options} value={value} disabled={disabled} onValueChange={(next) => onChange(next)}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? fieldMessageId(id) : undefined}
          className="h-10 w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value ?? 'none'} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
