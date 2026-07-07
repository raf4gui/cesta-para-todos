import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listCustomers } from "@/app/admin/clientes/actions"
import { formatCurrency, formatDate } from "@/lib/services/base"
import { Pagination } from "@/components/ui/pagination"
import { ClientFilters } from "@/components/admin/client-filters"
import { ClientCardMobile } from "@/components/admin/client-card-mobile"
import { GoToPageSelect } from "@/components/admin/go-to-page-select"
import { DeleteClientButton } from "@/components/admin/delete-client-button"
import { Plus, Users } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchParams {
  page?: string; limit?: string; search?: string; sort?: string
  ativo?: string; filter?: string
}

export default async function ClientesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const limit = Number(params?.limit) || 25
  const search = params?.search || ""
  const sort = params?.sort || "created_at_desc"
  const ativo = params?.ativo ?? ""
  const filter = params?.filter ?? ""

  const { data: customers, total, pageSize } = await listCustomers({ page, limit, search, sort, ativo, filter })

  const buildUrl = (p: number) => {
    const q = new URLSearchParams()
    if (p > 1) q.set("page", String(p))
    if (limit !== 25) q.set("limit", String(limit))
    if (search) q.set("search", search)
    if (sort !== "created_at_desc") q.set("sort", sort)
    if (ativo) q.set("ativo", ativo)
    if (filter) q.set("filter", filter)
    const qs = q.toString()
    return `/admin/clientes${qs ? `?${qs}` : ""}`
  }

  const from = total > 0 ? (page - 1) * pageSize + 1 : 0
  const to = Math.min(page * pageSize, total)
  const totalPages = Math.ceil(total / pageSize)

  // Build base query string for the GoToPageSelect (without page param)
  const goToPageQs = new URLSearchParams()
  if (limit !== 25) goToPageQs.set("limit", String(limit))
  if (search) goToPageQs.set("search", search)
  if (sort !== "created_at_desc") goToPageQs.set("sort", sort)
  if (ativo) goToPageQs.set("ativo", ativo)
  if (filter) goToPageQs.set("filter", filter)
  const goToPageBaseQs = goToPageQs.toString()

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Clientes</h1>
          <p className="text-sm text-[#526157]">{total} cliente{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/clientes/novo">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <ClientFilters initialSearch={search} initialSort={sort} initialAtivo={ativo} initialFilter={filter} />

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Nome</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Telefone</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">CPF/CNPJ</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Cidade</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Compras</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Gasto Total</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Cadastro</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {customers.map((customer: any) => (
              <tr key={customer.id} className="hover:bg-[#fcfdfa]">
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${customer.id}`} className="font-medium text-[#102016] hover:text-[#006B2E]">
                    {customer.name}
                  </Link>
                  {customer.notes && <div className="text-xs text-[#8c9c91] truncate max-w-[200px]">{customer.notes}</div>}
                </td>
                <td className="px-4 py-3 text-[#526157]">
                  <div>{customer.phone}</div>
                  {customer.whatsapp && <div className="text-xs text-green-600">WhatsApp: {customer.whatsapp}</div>}
                </td>
                <td className="px-4 py-3 text-[#526157]">{customer.cpf_cnpj || "-"}</td>
                <td className="px-4 py-3 text-[#526157]">{customer.city || "-"}</td>
                <td className="px-4 py-3 text-right font-mono">{customer.purchase_count}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(customer.total_spent)}</td>
                <td className="px-4 py-3">
                  <Badge variant={customer.ativo ? "default" : "secondary"} className={customer.ativo ? "bg-green-100 text-green-700" : ""}>
                    {customer.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#8c9c91]">{formatDate(customer.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link href={`/admin/clientes/${customer.id}`}>
                      <Button size="sm" variant="outline">Ver</Button>
                    </Link>
                    <Link href={`/admin/clientes/${customer.id}/editar`}>
                      <Button size="sm" variant="outline">Editar</Button>
                    </Link>
                    <DeleteClientButton customerId={customer.id} customerName={customer.name} />
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <Users className="h-8 w-8 mx-auto text-[#8c9c91] mb-2" />
                  <p className="text-[#8c9c91]">Nenhum cliente encontrado.</p>
                  <Link href="/admin/clientes/novo" className="text-[#006B2E] text-sm font-medium hover:underline mt-1 inline-block">
                    Cadastrar primeiro cliente
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {customers.map((customer: any) => (
          <ClientCardMobile key={customer.id} customer={customer} />
        ))}
        {customers.length === 0 && (
          <div className="rounded-xl border border-[#dfe7dd] bg-white p-8 text-center">
            <Users className="h-8 w-8 mx-auto text-[#8c9c91] mb-2" />
            <p className="text-[#8c9c91]">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {/* Footer with summary + pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-sm text-[#526157]">
          Mostrando {from}–{to} de {total} cliente{total !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2">
          {/* Per-page selector */}
          <form method="GET" className="flex items-center gap-2 text-sm text-[#526157]">
            <span className="hidden sm:inline">Exibir:</span>
            {[10, 25, 50, 100].map((n) => {
              const q = new URLSearchParams()
              if (page > 1) q.set("page", String(page))
              if (n !== 25) q.set("limit", String(n))
              if (search) q.set("search", search)
              if (sort !== "created_at_desc") q.set("sort", sort)
              if (ativo) q.set("ativo", ativo)
              if (filter) q.set("filter", filter)
              const qs = q.toString()
              return (
                <Link
                  key={n}
                  href={`/admin/clientes${qs ? `?${qs}` : ""}`}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                    limit === n ? "bg-[#006B2E] text-white" : "text-[#526157] hover:bg-gray-100"
                  }`}
                >
                  {n}
                </Link>
              )
            })}
          </form>

          {/* Page indicator + go-to */}
          <div className="flex items-center gap-2 ml-4">
            <Pagination total={total} page={page} pageSize={pageSize} buildUrl={buildUrl} />
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <GoToPageSelect totalPages={totalPages} currentPage={page} baseQueryString={goToPageBaseQs} />
      )}
    </section>
  )
}
