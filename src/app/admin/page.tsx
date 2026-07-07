import Link from "next/link"
import { getFullDashboard } from "@/lib/services/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/services/base"
import {
  TrendingUp, DollarSign, Package, Users, ShoppingBag,
  ArrowUpRight, LucideIcon, Box, ClipboardList
} from "lucide-react"

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

const STATUS_BG_BARS: Record<string, string> = {
  AGUARDANDO_CONTATO: "bg-yellow-400",
  EM_NEGOCIACAO: "bg-blue-500",
  PAGAMENTO_CONFIRMADO: "bg-cyan-500",
  EM_MONTAGEM: "bg-orange-500",
  EM_ENTREGA: "bg-purple-500",
  FINALIZADO: "bg-green-500",
  CANCELADO: "bg-red-400",
}

function MiniCard({ title, value, icon: Icon, color, trend }: {
  title: string
  value: string
  icon: LucideIcon
  color: string
  trend?: { value: string; positive: boolean }
}) {
  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#526157] uppercase tracking-wider">{title}</span>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-black text-[#102016]">{value}</div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.positive ? "text-green-600" : "text-red-600"}`}>
          <ArrowUpRight className="h-3 w-3" />
          {trend.value}
        </div>
      )}
    </div>
  )
}

function SalesBarChart({ data }: { data: { month: string; revenue: number; orders: number }[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#006B2E]" />
        Vendas Mensais
      </h2>
      <div className="flex items-end gap-1.5 h-48" style={{ "--bar-count": 12 } as React.CSSProperties}>
        {data.map((item) => {
          const heightPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
          const monthLabel = new Date(item.month + "-01").toLocaleDateString("pt-BR", { month: "short" })
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
              <span className="text-[10px] font-semibold text-[#526157] mb-0.5 truncate w-full text-center">
                {formatCurrency(item.revenue)}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#006B2E] to-[#00A85E] transition-all duration-300"
                style={{ height: `${heightPct}%`, minHeight: item.revenue > 0 ? "4px" : "0" }}
              />
              <span className="text-[10px] text-[#8c9c91] mt-1 truncate w-full text-center">{monthLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBarChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) {
    return (
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-[#006B2E]" />
          Pedidos por Status
        </h2>
        <p className="text-sm text-[#8c9c91] py-8 text-center">Nenhum pedido registrado.</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-[#006B2E]" />
        Pedidos por Status
      </h2>
      <div className="space-y-3">
        {data.map((item) => {
          const pct = (item.count / total) * 100
          return (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#102016]">{STATUS_LABELS[item.status] || item.status}</span>
                <span className="text-xs text-[#526157] font-semibold">{item.count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-3 rounded-full bg-[#f0f4f0] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${STATUS_BG_BARS[item.status] || "bg-gray-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-xs text-[#8c9c91] text-center pt-1">Total: {total} pedidos</div>
    </div>
  )
}

function DailySalesChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  if (data.length === 0) return null
  const width = 600
  const height = 160
  const padding = { top: 16, right: 8, bottom: 24, left: 8 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW
    const y = padding.top + chartH - (d.revenue / maxRevenue) * chartH
    return { x, y, ...d }
  })
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ")

  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#006B2E]" />
        Vendas Diárias (7 dias)
      </h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <polyline
          fill="none"
          stroke="#006B2E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#006B2E" stroke="white" strokeWidth="2" />
            <text x={p.x} y={padding.top - 4} textAnchor="middle" className="fill-[#526157]" fontSize="9" fontWeight="600">
              {formatCurrency(p.revenue)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const dayLabel = new Date(p.day).toLocaleDateString("pt-BR", { weekday: "short" })
          return (
            <text key={`label-${i}`} x={p.x} y={height - 4} textAnchor="middle" className="fill-[#8c9c91]" fontSize="9">
              {dayLabel}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default async function AdminDashboard() {
  const data = await getFullDashboard()

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Dashboard</h1>
          <p className="text-sm text-[#526157]">Indicadores atualizados em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/pedidos/novo">
            <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MiniCard
          title="Faturamento Total"
          value={formatCurrency(data.revenue)}
          icon={DollarSign}
          color="bg-[#006B2E]"
          trend={{ value: "Receita total", positive: true }}
        />
        <MiniCard
          title="Lucro Total"
          value={formatCurrency(data.profit)}
          icon={TrendingUp}
          color="bg-emerald-600"
          trend={{ value: "Margem sobre vendas", positive: true }}
        />
        <MiniCard
          title="Pedidos"
          value={String(data.totalOrders)}
          icon={ShoppingBag}
          color="bg-blue-600"
        />
        <MiniCard
          title="Clientes"
          value={String(data.totalCustomers)}
          icon={Users}
          color="bg-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesBarChart data={data.monthlySales} />
        <StatusBarChart data={data.ordersByStatus} />
      </div>

      {/* Daily Sales */}
      {data.dailySales.some(d => d.revenue > 0) && (
        <DailySalesChart data={data.dailySales} />
      )}

      {/* Secondary Stats Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-[#f0f9f4] p-3">
            <Package className="h-6 w-6 text-[#006B2E]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#526157] uppercase tracking-wider">Produtos Cadastrados</p>
            <p className="text-xl font-black text-[#102016]">{data.totalProducts}</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-[#f0f9f4] p-3">
            <Box className="h-6 w-6 text-[#006B2E]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#526157] uppercase tracking-wider">Itens em Estoque</p>
            <p className="text-xl font-black text-[#102016]">{data.totalStock}</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-[#f0f9f4] p-3">
            <ClipboardList className="h-6 w-6 text-[#006B2E]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#526157] uppercase tracking-wider">Pedidos Pendentes</p>
            <p className="text-xl font-black text-[#102016]">{data.pendingOrders}</p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#006B2E]" />
            Produtos Mais Vendidos
          </h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-[#8c9c91] py-8 text-center">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-2">
              {data.topProducts.map((prod, i) => (
                <div key={prod.name} className="flex items-center justify-between border-b border-[#f0f4f0] pb-2 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-[#8c9c91] w-5 shrink-0">#{i + 1}</span>
                    <div className="truncate">
                      <div className="font-semibold text-[#102016] truncate">{prod.name}</div>
                      <div className="text-xs text-[#8c9c91] truncate">{prod.category}</div>
                    </div>
                  </div>
                  <Badge className="bg-[#006B2E] text-white font-extrabold shrink-0">{prod.quantity} un.</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#006B2E]" />
              Últimos Pedidos
            </h2>
            <Link href="/admin/pedidos">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-[#8c9c91] py-8 text-center">Nenhum pedido registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fcfdfa] text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-[#526157]">Protocolo</th>
                    <th className="px-3 py-2 font-semibold text-[#526157]">Cliente</th>
                    <th className="px-3 py-2 font-semibold text-[#526157] text-right">Total</th>
                    <th className="px-3 py-2 font-semibold text-[#526157]">Status</th>
                    <th className="px-3 py-2 font-semibold text-[#526157] text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f0]">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fcfdfa]">
                      <td className="px-3 py-2.5 font-mono font-bold text-[#006B2E]">
                        <Link href={`/admin/pedidos/${order.id}`} className="hover:underline">
                          {order.protocol}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-[#102016] truncate max-w-[120px]">{order.customer_name}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(order.total_value)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#8c9c91] text-xs">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
