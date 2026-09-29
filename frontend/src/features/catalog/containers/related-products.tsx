import { ProductGrid } from '../components/product-grid'
import { useProducts } from '../hooks/use-products'

const RELATED_COUNT = 4

export function RelatedProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  const products = useProducts({ category: categoryId, pageSize: RELATED_COUNT + 1 })
  const related = products.data?.data.filter((product) => product.id !== excludeId).slice(0, RELATED_COUNT) ?? []

  if (related.length === 0) return null

  return (
    <section aria-labelledby="related-heading" className="flex flex-col gap-6 border-t pt-10">
      <h2 id="related-heading" className="font-heading text-3xl tracking-tight">
        También te puede interesar
      </h2>
      <ProductGrid products={related} />
    </section>
  )
}
