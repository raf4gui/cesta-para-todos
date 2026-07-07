import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, PackageX, TrendingUp, Plus } from "lucide-react"
import { RealtimeRefresh } from "@/components/admin/realtime-refresh"
import { getStockSummary, listStockMovements } from "@/lib/services/stock"

export const dynamic = "force-dynamic"

function formatCurrency(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }
function formatDateTime(d: string) { return new Date(d).toLocaleString("pt-BR") }

export default async function EstoquePage() {
  const { all: products, esgotados, baixo, normal, totalValue } = await getStockSummary()
  const { data: movements } = await listStockMovements({ limit: 15 })

  return (
    <section className="space-y-6 p-6">
      <RealtimeRefresh tables={["products", "stock_movements"]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Estoque</h1>
          <p className="text-sm text-[#526157]">Controle de inventário</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/produtos"><Button variant="outline">Gerenciar Produtos</Button></Link>
          <Link href="/admin/produtos/novo"><Button className="bg-[#006B2E] text-white hover:bg-[#005324]"><Plus className="h-4 w-4 mr-2" />Novo Produto</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <PackageX className="h-6 w-6 text-red-600 mb-2" />
          <div className="text-2xl font-black text-red-700">{esgotados.length}</div>
          <div className="text-sm font-medium text-red-600">Esgotados</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 mb-2" />
          <div className="text-2xl font-black text-amber-700">{baixo.length}</div>
          <div className="text-sm font-medium text-amber-600">Estoque Baixo</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <Package className="h-6 w-6 text-green-600 mb-2" />
          <div className="text-2xl font-black text-green-700">{normal.length}</div>
          <div className="text-sm font-medium text-green-600">Normal</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
          <div className="text-2xl font-black text-blue-700">{formatCurrency(totalValue)}</div>
          <div className="text-sm font-medium text-blue-600">Valor em Estoque</div>
        </div>
      </div>

      {esgotados.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100">
            <h2 className="text-sm font-bold text-red-800">Produtos Esgotados</h2>
          </div>
          <div className="divide-y">{[...esgotados].map((p: any) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <span className="font-semibold text-[#102016]">{p.name}</span>
              <Link href={`/admin/produtos/${p.id}`}><Button size="sm" variant="outline">Editar</Button></Link>
            </div>
          ))}</div>
        </div>
      )}

      <div className="rounded-xl border border-[#dfe7dd] bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-[#fcfdfa]">
          <h2 className="text-sm font-bold text-[#102016]">Todos os Produtos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Produto</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Categoria</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Preço</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Estoque</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Mínimo</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Situação</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f0]">
              {products.map((p: any) => {
                const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
                const minStock = p.min_stock || 5
                const sc = p.stock === 0 ? { label: "Esgotado", cls: "bg-red-100 text-red-700 border-red-200" }
                  : p.stock <= minStock ? { label: "Baixo", cls: "bg-amber-100 text-amber-700 border-amber-200" }
                  : { label: "Normal", cls: "bg-green-100 text-green-700 border-green-200" }
                return (<tr key={p.id} className="hover:bg-[#fcfdfa]">
                  <td className="px-4 py-3 font-medium text-[#102016]">{p.name}</td>
                  <td className="px-4 py-3 text-[#526157]">{cat?.name || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.sale_price || p.price || 0)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{p.stock}</td>
                  <td className="px-4 py-3 text-right text-[#8c9c91]">{minStock}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${sc.cls}`}>{sc.label}</span></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/produtos/${p.id}`}><Button size="sm" variant="outline">Editar</Button></Link></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-[#fcfdfa]">
          <h2 className="text-sm font-bold text-[#102016]">Últimas Movimentações</h2>
        </div>
        {movements.length === 0 ? <div className="py-8 text-center text-[#8c9c91]">Nenhuma movimentação.</div> : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left"><tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Produto</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Tipo</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Qtd</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Motivo</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Data</th>
            </tr></thead>
            <tbody className="divide-y divide-[#f0f4f0]">{[...movements].map((m: any) => {
              const prod = Array.isArray(m.product) ? m.product[0] : m.product
              return (<tr key={m.id} className="hover:bg-[#fcfdfa]">
                <td className="px-4 py-3 font-medium text-[#102016]">{prod?.name || "-"}</td>
                <td className="px-4 py-3"><Badge variant={m.movement_type === "ENTRADA" ? "default" : m.movement_type === "SAIDA" ? "destructive" : "secondary"}>{m.movement_type}</Badge></td>
                <td className="px-4 py-3 text-right font-mono">{m.quantity}</td>
                <td className="px-4 py-3 text-[#526157]">{m.reason || "-"}</td>
                <td className="px-4 py-3 text-right text-[#8c9c91]">{formatDateTime(m.created_at)}</td>
              </tr>)
            })}</tbody>
          </table>
          </div>
        )}
      </div>
    </section>
  )
}
