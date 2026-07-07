import { notFound } from "next/navigation"
import { ProductForm, type FormValues as ProductFormValues } from "@/components/admin/product-form"
import { getProduct } from "@/app/admin/produtos/actions"

export const dynamic = "force-dynamic"

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let product: (ProductFormValues & { id: string }) | null = null
  try {
    product = await getProduct(id)
  } catch {
    notFound()
  }

  if (!product) notFound()

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Editar Produto</h1>
      <div className="max-w-2xl rounded-lg border bg-white p-6">
        <ProductForm initialData={product} />
      </div>
    </section>
  )
}
