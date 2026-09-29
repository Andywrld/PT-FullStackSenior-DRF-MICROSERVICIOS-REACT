import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'

import { useDeleteProduct } from '../hooks/use-admin-products'
import type { AdminProduct } from '../model/admin-product'

type DeleteProductDialogProps = {
  open: boolean
  product: AdminProduct | null
  onOpenChange: (open: boolean) => void
}

export function DeleteProductDialog({ open, product, onOpenChange }: DeleteProductDialogProps) {
  const remove = useDeleteProduct()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`¿Eliminar "${product?.name ?? ''}"?`}
      description="Se eliminará junto con sus imágenes. Las órdenes ya realizadas conservan sus datos. Si solo quieres ocultarlo, desactívalo."
      confirmLabel={remove.isPending ? 'Eliminando…' : 'Eliminar'}
      destructive
      pending={remove.isPending}
      onConfirm={() => {
        if (!product) return
        remove.mutate(product.id, {
          onSuccess: () => toast.success('Producto eliminado'),
          onError: (error) => toast.error(getErrorMessage(error)),
          onSettled: () => onOpenChange(false),
        })
      }}
    />
  )
}
