import { getBasket } from "@/app/admin/cestas/actions"
import BasketForm from "@/components/admin/basket-form"
import { notFound } from "next/navigation"
import type { BasketFormValues } from "@/components/admin/basket-form"

export const dynamic = "force-dynamic"

export default async function EditarCestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let initialData: (Partial<BasketFormValues> & { id?: string }) | null = null

  try {
    const result = await getBasket(id)
    const basket = result.basket
    if (!basket) notFound()

    const mappedItems = (result.items ?? []).map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      is_customizable: item.is_customizable,
      allowed_brand_ids: (item.allowed_brands ?? []).map((b: any) => b.id),
    }))

    initialData = {
      id: basket.id,
      name: basket.name,
      description: basket.description || "",
      image_url: basket.image_url || "",
      price: basket.price,
      internal_price: basket.internal_price,
      show_price: basket.show_price ?? true,
      show_catalog: basket.show_catalog ?? true,
      ativo: basket.ativo,
      tipo: basket.tipo,
      brand_id: basket.brand_id || "",
      quantidade_fardo: basket.quantidade_fardo,
      items: mappedItems,
    }
  } catch {
    notFound()
  }

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Editar Cesta</h1>
      <BasketForm initialData={initialData} />
    </section>
  )
}
