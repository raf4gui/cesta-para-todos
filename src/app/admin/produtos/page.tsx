import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ProductTable from "@/components/admin/product-table"
import ProductFilters from "@/components/admin/product-filters"
import { listProducts } from "@/lib/services/products"
import { listFormCategories } from "@/app/admin/produtos/actions"
import { Pagination } from "@/components/ui/pagination"
import Loading from "@/app/admin/produtos/loading"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchParams { page?: string; search?: string; category?: string; active?: string; sort?: string }

export default async function ProdutosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = params?.search || ""
  const category = params?.category || ""
  const active = params?.active || ""
  const sort = params?.sort || "created_at_desc"

  const categories = await listFormCategories()

  const { data, total, pageSize } = await listProducts({ page, search, categoryId: category, active, sort })
  const buildUrl = (p: number) => {
    const q = new URLSearchParams()
    if (p > 1) q.set("page", String(p))
    if (search) q.set("search", search)
    if (category) q.set("category", category)
    if (active) q.set("active", active)
    if (sort !== "created_at_desc") q.set("sort", sort)
    const qs = q.toString()
    return `/admin/produtos${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Produtos</h1>
          <p className="text-sm text-[#526157]">{total} produtos cadastrados</p>
        </div>
        <Link href="/admin/produtos/novo">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      <ProductFilters initialSearch={search} initialCategory={category} initialActive={active} initialSort={sort} categories={categories} />

      <Suspense fallback={<Loading />}>
        <ProductTable products={data || []} />
      </Suspense>

      <Pagination total={total} page={page} pageSize={pageSize} buildUrl={buildUrl} />
    </section>
  )
}
