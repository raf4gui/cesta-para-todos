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

const BASE_PATH = "/admin/fardos"
const BASE_URL = "/admin/fardos"

interface SearchParams { page?: string; search?: string; sort?: string; active?: string }

export default async function FardosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = params?.search ?? ""
  const sort = params?.sort ?? "created_at_desc"
  const active = params?.active ?? ""

  const { data: baskets, total, pageSize } = await listBaskets({ page, search, sort, active, tipo: "FARDO" })

  const buildUrl = (p: number) => {
    const q = new URLSearchParams()
    if (p > 1) q.set("page", String(p))
    if (search) q.set("search", search)
    if (sort !== "created_at_desc") q.set("sort", sort)
    if (active) q.set("active", active)
    const qs = q.toString()
    return `${BASE_PATH}${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Fardos</h1>
          <p className="text-sm text-[#526157]">{total} fardos cadastrados</p>
        </div>
        <Link href={`${BASE_PATH}/nova`}>
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fardo
          </Button>
        </Link>
      </div>

      <BasketFilters initialSearch={search} initialSort={sort} initialActive={active} initialTipo="" baseUrl={BASE_URL} />

      <Suspense fallback={<Loading />}>
        <BasketTable baskets={baskets} basePath={BASE_PATH} />
      </Suspense>

      <Pagination total={total} page={page} pageSize={pageSize} buildUrl={buildUrl} />
    </section>
  )
}
