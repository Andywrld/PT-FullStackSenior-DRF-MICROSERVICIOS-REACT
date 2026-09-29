import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { getErrorMessage } from '@/shared/api/error-messages'
import { FormField } from '@/shared/components/form-field'
import { TextField } from '@/shared/components/text-field'
import { useServerFieldErrors } from '@/shared/hooks/use-server-field-errors'
import { fieldMessageId } from '@/shared/lib/field-message-id'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'

import { categoryFormSchema, type CategoryFormValues } from '../model/admin-category'

type CategoryFormProps = {
  defaultValues: CategoryFormValues
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (values: CategoryFormValues) => void
  onCancel: () => void
}

export function CategoryForm({ defaultValues, submitLabel, pending, error, onSubmit, onCancel }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({ resolver: zodResolver(categoryFormSchema), defaultValues })
  const hasFieldErrors = useServerFieldErrors(form, error)
  const { errors } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {Boolean(error) && !hasFieldErrors && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}
      <TextField label="Nombre" required autoFocus error={errors.name?.message} {...form.register('name')} />
      <FormField id="category-description" label="Descripción" error={errors.description?.message}>
        <Textarea
          id="category-description"
          rows={3}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? fieldMessageId('category-description') : undefined}
          {...form.register('description')}
        />
      </FormField>
      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Visible en la tienda</span>
              <span className="text-sm text-muted-foreground">Si la desactivas, no se podrá asignar a productos.</span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
