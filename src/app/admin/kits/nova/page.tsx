import BasketForm from "@/components/admin/basket-form"

export default function NovoKitPage() {
  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Novo Kit</h1>
      <BasketForm redirectPath="/admin/kits" />
    </section>
  )
}
