import { ProductForm } from "@/components/admin/product-form"

export default function NovoProdutoPage() {
  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Novo Produto</h1>
      <div className="max-w-2xl rounded-lg border bg-white p-6">
        <ProductForm />
      </div>
    </section>
  )
}
