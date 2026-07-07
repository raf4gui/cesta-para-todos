import { CustomerForm } from "@/components/admin/customer-form"

export default function NovoClientePage() {
  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Novo Cliente</h1>
      <div className="max-w-2xl rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-sm">
        <CustomerForm />
      </div>
    </section>
  )
}
