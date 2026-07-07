import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/admin/customer-form"
import { getCustomer } from "@/lib/services/customers"

export const dynamic = "force-dynamic"

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let data
  try {
    data = await getCustomer(id)
  } catch {
    notFound()
  }

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Editar Cliente</h1>
      <div className="max-w-2xl rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-sm">
        <CustomerForm initialData={{ ...data.customer, id: data.customer.id }} />
      </div>
    </section>
  )
}
