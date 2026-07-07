import { listPersonalizationProducts } from "@/app/admin/produtos/actions"
import { PersonalizationManager } from "./personalization-manager"

export const dynamic = "force-dynamic"

export default async function PersonalizacaoPage() {
  const products = await listPersonalizationProducts()

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Produtos da Cesta Personalizada</h1>
        <p className="text-sm text-[#526157] mt-0.5">
          Ative os produtos que devem aparecer na Cesta Personalizada e reordene conforme desejar.
        </p>
      </div>
      <PersonalizationManager products={products} />
    </section>
  )
}
