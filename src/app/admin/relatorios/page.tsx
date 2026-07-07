import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVDownloader } from "@/components/admin/csv-downloader"
import { ReportCSVDownload } from "@/components/admin/report-csv-export"
import { getSalesReport, getProductReport } from "@/lib/services/reports"
import { getStockSummary } from "@/lib/services/stock"
import { listFinancialEntries } from "@/lib/services/financial"
import { AlertTriangle, Calendar, DollarSign, ShoppingBag, BarChart3, Download, TrendingUp, TrendingDown, Users, Package, PiggyBank } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function formatCurrency(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }

interface SearchParams { startDate?: string; endDate?: string; groupBy?: string }

export default async function RelatoriosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const today = new Date().toISOString().split("T")[0]
  const d = new Date(); d.setDate(d.getDate() - 30); const thirtyDaysAgo = d.toISOString().split("T")[0]
  const startDate = params?.startDate || thirtyDaysAgo
  const endDate = params?.endDate || today
  const groupBy = (params?.groupBy || "month") as "day" | "week" | "month" | "year"

  // Sales report (orders + grouped evolution)
  const salesReport = await getSalesReport({ startDate, endDate, groupBy })
  const { totalRevenue, totalProfit, totalOrders, avgTicket, margin, orders } = salesReport
  const groupedBase = salesReport.grouped as Record<string, { revenue: number; profit: number; orders: number }>

  // Expenses for the same period
  const { data: periodExpenses } = await listFinancialEntries({ startDate, endDate, limit: 500 })

  const totalExpenses = (periodExpenses ?? [])
    .filter((e: any) => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid)
    .reduce((s: number, e: any) => s + Number(e.amount), 0)
  const netProfit = totalRevenue - totalExpenses
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Grouped evolution with expenses merged in
  const grouped: Record<string, { revenue: number; profit: number; orders: number; expenses: number }> = {}
  for (const [key, val] of Object.entries(groupedBase)) {
    grouped[key] = { ...val, expenses: 0 }
  }
  for (const expense of (periodExpenses ?? []).filter((e: any) => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid)) {
    const date = new Date(expense.created_at)
    let key: string
    if (groupBy === "day") key = date.toISOString().split("T")[0]
    else if (groupBy === "week") { const ws = new Date(date); ws.setDate(date.getDate() - date.getDay()); key = ws.toISOString().split("T")[0] }
    else if (groupBy === "month") key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    else key = `${date.getFullYear()}`
    if (!grouped[key]) grouped[key] = { revenue: 0, profit: 0, orders: 0, expenses: 0 }
    grouped[key].expenses += Number(expense.amount)
  }

  // Product report
  const productReport = await getProductReport({ startDate, endDate })

  // Top customers
  const customerSummary: Record<string, any> = {}
  for (const order of orders ?? []) {
    const c = order.customer as any
    const name = c?.name || "Desconhecido"
    if (!customerSummary[name]) customerSummary[name] = { name, orders: 0, total: 0 }
    customerSummary[name].orders += 1
    customerSummary[name].total += Number(order.total_value || 0)
  }
  const topCustomers = Object.values(customerSummary).sort((a: any, b: any) => b.total - a.total).slice(0, 10)

  // Inventory value
  const stockSummary = await getStockSummary()
  const allProducts = stockSummary.all
  const totalStockValue = allProducts.reduce((s: number, p: any) => s + (Number(p.stock || 0) * Number(p.sale_price || 0)), 0)
  const totalStockCost = allProducts.reduce((s: number, p: any) => s + (Number(p.stock || 0) * Number(p.purchase_price || p.price || 0)), 0)

  // Low stock (stock <= 5)
  const lowStock = stockSummary.baixo.filter((p: any) => p.stock <= 5).sort((a: any, b: any) => a.stock - b.stock)

  // Daily billing
  const dailyBilling: Record<string, number> = {}
  for (const order of orders ?? []) {
    const day = order.created_at?.split("T")[0]
    if (day) dailyBilling[day] = (dailyBilling[day] || 0) + Number(order.total_value || 0)
  }
  const maxDaily = Math.max(...Object.values(dailyBilling), 1)

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Relatórios</h1>
          <p className="text-sm text-[#526157]">Análise completa de vendas, despesas e lucro</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm">
        <form method="GET" className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#526157]">Data Inicial</label>
            <input type="date" name="startDate" defaultValue={startDate} className="flex h-9 rounded-md border border-[#dfe7dd] px-3 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#526157]">Data Final</label>
            <input type="date" name="endDate" defaultValue={endDate} className="flex h-9 rounded-md border border-[#dfe7dd] px-3 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#526157]">Agrupar</label>
            <select name="groupBy" defaultValue={groupBy} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option><option value="year">Ano</option>
            </select>
          </div>
          <Button type="submit" className="h-10 bg-[#006B2E] text-white hover:bg-[#005324]">Filtrar</Button>
          <Link href="/admin/relatorios" className="text-xs text-[#006B2E] underline h-9 flex items-center">Limpar</Link>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]"><DollarSign className="h-4 w-4 inline mr-2" />Faturamento</CardTitle></CardHeader><CardContent><div className="text-2xl font-black text-[#102016]">{formatCurrency(totalRevenue)}</div><p className="text-xs text-[#8c9c91] mt-1">{totalOrders} pedidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]"><TrendingDown className="h-4 w-4 inline mr-2 text-red-500" />Despesas</CardTitle></CardHeader><CardContent><div className="text-2xl font-black text-red-600">{formatCurrency(totalExpenses)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]"><PiggyBank className="h-4 w-4 inline mr-2 text-green-500" />Lucro Líquido</CardTitle></CardHeader><CardContent><div className={`text-2xl font-black ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(netProfit)}</div><p className="text-xs text-[#8c9c91] mt-1">Margem: {netMargin.toFixed(1)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]"><Package className="h-4 w-4 inline mr-2" />Estoque (custo)</CardTitle></CardHeader><CardContent><div className="text-2xl font-black text-[#102016]">{formatCurrency(totalStockCost)}</div><p className="text-xs text-[#8c9c91] mt-1">Valor de venda: {formatCurrency(totalStockValue)}</p></CardContent></Card>
      </div>

      {/* Daily billing bar chart */}
      {Object.keys(dailyBilling).length > 0 && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-[#102016] flex items-center gap-2"><Calendar className="h-5 w-5 text-[#006B2E]" />Faturamento Diário</h2>
          <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-1">
            {Object.entries(dailyBilling).sort(([a], [b]) => a.localeCompare(b)).map(([day, value]) => (
              <div key={day} className="flex flex-col items-center gap-0.5 min-w-[32px]">
                <div className="w-full rounded-t bg-gradient-to-t from-[#006B2E] to-green-400 transition-all" style={{ height: `${(value / maxDaily) * 100}px`, minHeight: value > 0 ? "4px" : "0" }} />
                <span className="text-[9px] text-[#8c9c91] whitespace-nowrap">{new Date(day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolution table */}
      {Object.keys(grouped).length > 0 && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#102016]">Evolução {groupBy === "day" ? "Diária" : groupBy === "week" ? "Semanal" : groupBy === "month" ? "Mensal" : "Anual"}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fcfdfa] text-left"><tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Período</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Pedidos</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Faturamento</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Despesas</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Lucro</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f0f4f0]">
                {Object.entries(grouped).sort().map(([period, data]: [string, any]) => (
                  <tr key={period} className="hover:bg-[#fcfdfa]">
                    <td className="px-4 py-3 font-medium text-[#102016]">{period}</td>
                    <td className="px-4 py-3 text-right">{data.orders}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(data.revenue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{formatCurrency(data.expenses)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{formatCurrency(data.revenue - data.expenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#102016] flex items-center gap-2"><Users className="h-5 w-5 text-[#006B2E]" />Clientes que Mais Compraram</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fcfdfa] text-left"><tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Cliente</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Pedidos</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Total Gasto</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f0f4f0]">
                {topCustomers.map((c: any) => (
                  <tr key={c.name} className="hover:bg-[#fcfdfa]">
                    <td className="px-4 py-3 font-medium text-[#102016]">{c.name}</td>
                    <td className="px-4 py-3 text-right">{c.orders}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#006B2E]">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Sold */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#102016] flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-[#006B2E]" />Produtos Vendidos</h2>
        {productReport.length === 0 ? <p className="text-sm text-[#8c9c91] py-8 text-center">Nenhum produto vendido no período.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fcfdfa] text-left"><tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Produto</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Categoria</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Qtd</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Receita</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Lucro</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f0f4f0]">
                {(productReport as any[]).map((prod: any) => (
                  <tr key={prod.name} className="hover:bg-[#fcfdfa]">
                    <td className="px-4 py-3 font-medium text-[#102016]">{prod.name}</td>
                    <td className="px-4 py-3 text-[#526157]">{prod.category}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{prod.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(prod.revenue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{formatCurrency(prod.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Status */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-[#102016] flex items-center gap-2"><Package className="h-5 w-5 text-[#006B2E]" />Resumo do Estoque</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-[#fcfdfa] border border-[#dfe7dd] p-3">
              <p className="text-xs text-[#526157]">Produtos Ativos</p>
              <p className="text-xl font-black text-[#102016]">{allProducts?.length || 0}</p>
            </div>
            <div className="rounded-lg bg-[#fcfdfa] border border-[#dfe7dd] p-3">
              <p className="text-xs text-[#526157]">Estoque Crítico</p>
              <p className="text-xl font-black text-red-600">{lowStock?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102016] flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Estoque Crítico</h2>
            {lowStock && lowStock.length > 0 && <CSVDownloader data={lowStock} filename={`estoque_baixo_${today}.csv`} />}
          </div>
          {(!lowStock || lowStock.length === 0) ? (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-4 font-semibold text-center">Todos os produtos com estoque saudável.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fcfdfa] text-left"><tr>
                  <th className="px-4 py-3 font-semibold text-[#526157]">Produto</th>
                  <th className="px-4 py-3 font-semibold text-[#526157]">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-right">Estoque</th>
                </tr></thead>
                <tbody className="divide-y divide-[#f0f4f0]">
                  {lowStock.map((p: any) => {
                    const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
                    return (<tr key={p.id} className="hover:bg-[#fcfdfa]">
                      <td className="px-4 py-3 font-bold text-[#102016]">{p.name}</td>
                      <td className="px-4 py-3 text-[#526157]">{cat?.name || "Sem categoria"}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{p.stock}</td>
                    </tr>)
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ReportCSVDownload data={{ grouped, productReport, topCustomers, dailyBilling, startDate, endDate, groupBy }} />
    </section>
  )
}
