import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'

import { useDeleteCategory } from '../hooks/use-admin-categories'
import type { AdminCategory } from '../model/admin-category'

type DeleteCategoryDialogProps = {
  open: boolean
  category: AdminCategory | null
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({ open, category, onOpenChange }: DeleteCategoryDialogProps) {
  const remove = useDeleteCategory()
  const productCount = category?.product_count ?? 0
  const inUse = productCount > 0

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`¿Eliminar "${category?.name ?? ''}"?`}
      description={
        inUse
          ? `Tiene ${productCount} ${productCount === 1 ? 'producto asignado' : 'productos asignados'} y no se puede eliminar. Desactívala para ocultarla, o mueve sus productos primero.`
          : 'Esta acción no se puede deshacer.'
      }
      confirmLabel={remove.isPending ? 'Eliminando…' : 'Eliminar'}
      destructive
      pending={remove.isPending}
      confirmDisabled={inUse}
      onConfirm={() => {
        if (!category) return
        remove.mutate(category.id, {
          onSuccess: () => toast.success('Categoría eliminada'),
          onError: (error) => toast.error(getErrorMessage(error)),
          onSettled: () => onOpenChange(false),
        })
      }}
    />
  )
}
