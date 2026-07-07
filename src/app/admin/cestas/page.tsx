import { Suspense } from "react"
import BasketTable from "@/components/admin/basket-table"
import BasketFilters from "@/components/admin/basket-filters"
import { listBaskets } from "@/app/admin/cestas/actions"
import { Loading } from "@/app/admin/cestas/loading"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchParams { page?: string; search?: string; sort?: string; active?: string; tipo?: string }

export default async function CestasPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = params?.search ?? ""
  const sort = params?.sort ?? "created_at_desc"
  const active = params?.active ?? ""
  const tipo = params?.tipo ?? ""

  const { data: baskets, total, pageSize } = await listBaskets({ page, search, sort, active, tipo })

  const buildUrl = (p: number) => {
    const q = new URLSearchParams()
    if (p > 1) q.set("page", String(p))
    if (search) q.set("search", search)
    if (sort !== "created_at_desc") q.set("sort", sort)
    if (active) q.set("active", active)
    if (tipo) q.set("tipo", tipo)
    const qs = q.toString()
    return `/admin/cestas${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Cestas</h1>
          <p className="text-sm text-[#526157]">{total} cestas cadastradas</p>
        </div>
        <Link href="/admin/cestas/nova">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cesta
          </Button>
        </Link>
      </div>

      <BasketFilters initialSearch={search} initialSort={sort} initialActive={active} initialTipo={tipo} />

      <Suspense fallback={<Loading />}>
        <BasketTable baskets={baskets} />
      </Suspense>

      <Pagination total={total} page={page} pageSize={pageSize} buildUrl={buildUrl} />
    </section>
  )
}
