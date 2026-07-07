import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listOrders } from "@/lib/services/orders"
import { formatCurrency, formatDate } from "@/lib/services/base"
import { Plus, Search } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CONTATO: "Aguardando contato",
  EM_NEGOCIACAO: "Em negociação",
  PAGAMENTO_CONFIRMADO: "Pagamento confirmado",
  EM_MONTAGEM: "Em montagem",
  EM_ENTREGA: "Em entrega",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_CONTATO: "bg-yellow-100 text-yellow-800 border-yellow-200",
  EM_NEGOCIACAO: "bg-blue-100 text-blue-800 border-blue-200",
  PAGAMENTO_CONFIRMADO: "bg-cyan-100 text-cyan-800 border-cyan-200",
  EM_MONTAGEM: "bg-orange-100 text-orange-800 border-orange-200",
  EM_ENTREGA: "bg-purple-100 text-purple-800 border-purple-200",
  FINALIZADO: "bg-green-100 text-green-800 border-green-200",
  CANCELADO: "bg-red-100 text-red-800 border-red-200",
}

interface SearchParams { page?: string; search?: string; status?: string }

export default async function PedidosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = params?.search || ""
  const status = params?.status || ""
  const { data: orders, total, pageSize } = await listOrders({ page, search, status })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Pedidos</h1>
          <p className="text-sm text-[#526157]">{total} pedidos registrados</p>
        </div>
        <Link href="/admin/pedidos/novo">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
              <input name="search" defaultValue={search} placeholder="Protocolo ou cliente..."
                className="w-full pl-9 h-9 rounded-md border border-[#dfe7dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006B2E]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Status</label>
            <select name="status" defaultValue={status}
              className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm bg-white">
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" className="h-9">Filtrar</Button>
          {(search || status) && (
            <Link href="/admin/pedidos" className="text-xs text-[#006B2E] underline h-9 flex items-center">Limpar</Link>
          )}
        </form>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const count = orders.filter((o) => o.status === key).length
          return (
            <Link key={key} href={`/admin/pedidos?status=${key}`}>
              <div className={`rounded-xl border p-3 text-center cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[key] || ""}`}>
                <div className="text-xl font-black">{count}</div>
                <div className="text-xs font-medium mt-0.5">{label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Protocolo</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Cliente</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Valor</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Pagamento</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Data</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-[#fcfdfa]">
                <td className="px-4 py-3 font-mono font-bold text-[#006B2E]">{order.protocol}</td>
                <td className="px-4 py-3 font-medium text-[#102016]">{order.customer?.name ?? "-"}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(order.total_value || 0)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={order.payment_status === "CONFIRMADO" ? "default" : "secondary"}
                    className={order.payment_status === "CONFIRMADO" ? "bg-green-100 text-green-700" : ""}>
                    {order.payment_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#8c9c91] text-xs">{formatDate(order.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/pedidos/${order.id}`}>
                    <Button size="sm" variant="outline">Abrir</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#8c9c91]">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-[#526157]">
          <span>Total: {total} pedidos</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/pedidos?page=${page - 1}&search=${search}&status=${status}`}>
                <Button variant="outline" size="sm">← Anterior</Button>
              </Link>
            )}
            <span className="py-2 px-3">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/pedidos?page=${page + 1}&search=${search}&status=${status}`}>
                <Button variant="outline" size="sm">Próxima →</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
