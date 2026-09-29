import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { type ComponentProps, useId, useState } from 'react'

import { fieldMessageId } from '@/shared/lib/field-message-id'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/shared/ui/input-group'

import { FormField } from './form-field'

type PasswordFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
  label: string
  error?: string
  hint?: string
}

export function PasswordField({ label, error, hint, required, id, ...props }: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <FormField id={inputId} label={label} required={required} error={error} hint={hint}>
      <InputGroup className="h-10">
        <InputGroupInput
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-required={required || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? fieldMessageId(inputId) : undefined}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FormField>
  )
}
