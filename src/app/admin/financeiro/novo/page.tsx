import { FinancialEntryForm } from "@/components/admin/financial-entry-form"

interface SearchParams { type?: string; category?: string }

export default async function NovoFinanceiroPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#102016]">
        {params?.type === "DESPESA" ? "Nova Despesa" : "Novo Lançamento Financeiro"}
      </h1>
      <div className="max-w-2xl rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-sm">
        <FinancialEntryForm initialType={params?.type} initialCategory={params?.category} />
      </div>
    </section>
  )
}
