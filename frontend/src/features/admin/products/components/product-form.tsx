import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { getErrorMessage } from '@/shared/api/error-messages'
import { FormField } from '@/shared/components/form-field'
import { SelectField } from '@/shared/components/select-field'
import { TextField } from '@/shared/components/text-field'
import { useServerFieldErrors } from '@/shared/hooks/use-server-field-errors'
import { fieldMessageId } from '@/shared/lib/field-message-id'
import { sanitizeDecimal, sanitizeInteger } from '@/shared/lib/numeric-input'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'

import { productFormSchema, type ProductFormValues } from '../model/admin-product'

type ProductFormProps = {
  defaultValues: ProductFormValues
  categoryOptions: { value: string | null; label: string }[]
  submitLabel: string
  pendingLabel?: string
  pending: boolean
  error: unknown
  onSubmit: (values: ProductFormValues) => void
  onCancel: () => void
  /** Extra content between the fields and the actions (the images of an existing product). */
  children?: ReactNode
}

export function ProductForm({
  defaultValues,
  categoryOptions,
  submitLabel,
  pendingLabel,
  pending,
  error,
  onSubmit,
  onCancel,
  children,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues })
  const hasFieldErrors = useServerFieldErrors(form, error)
  const { errors } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {Boolean(error) && !hasFieldErrors && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {getErrorMessage(error)}
          </p>
        )}
        <TextField label="Nombre" required autoFocus error={errors.name?.message} {...form.register('name')} />
        <div className="grid gap-5 sm:grid-cols-3">
          <Controller
            control={form.control}
            name="price"
            render={({ field }) => (
              <TextField
                label="Precio (USD)"
                required
                inputMode="decimal"
                placeholder="0.00"
                error={errors.price?.message}
                {...field}
                onChange={(event) => field.onChange(sanitizeDecimal(event.target.value))}
              />
            )}
          />
          <Controller
            control={form.control}
            name="stock"
            render={({ field }) => (
              <TextField
                label="Stock"
                required
                inputMode="numeric"
                error={errors.stock?.message}
                {...field}
                onChange={(event) => field.onChange(sanitizeInteger(event.target.value))}
              />
            )}
          />
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <SelectField
                label="Categoría"
                value={field.value}
                options={categoryOptions}
                onChange={field.onChange}
                error={errors.category_id?.message}
              />
            )}
          />
        </div>
        <FormField id="product-description" label="Descripción" error={errors.description?.message}>
          <Textarea
            id="product-description"
            rows={4}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? fieldMessageId('product-description') : undefined}
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
                <span className="text-sm text-muted-foreground">Si lo desactivas, nadie podrá comprarlo.</span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
        {children}
      </div>
      <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-surface px-6 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (pendingLabel ?? 'Guardando…') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
