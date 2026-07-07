"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { listFinancialEntries } from "@/app/admin/financeiro/actions"

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }
function fmtDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR") }
function shortMonth(m: string) {
  const [y, mo] = m.split("-")
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return months[parseInt(mo) - 1]
}

function FluxoCaixaTabContent() {
  const [loading, setLoading] = useState(true)
  const [monthEntries, setMonthEntries] = useState<any[]>([])
  const [allEntries, setAllEntries] = useState<any[]>([])
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
  const yearStart = `${now.getFullYear()}-01-01`
  const yearEnd = `${now.getFullYear()}-12-31`
  const weekStart = new Date(now.getTime() - now.getDay() * 86400000).toISOString().split("T")[0]
  const weekEnd = new Date(now.getTime() + (6 - now.getDay()) * 86400000).toISOString().split("T")[0]
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split("T")[0]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [month, all, recent] = await Promise.all([
        listFinancialEntries({ startDate: monthStart, endDate: monthEnd, limit: 500 }),
        listFinancialEntries({ startDate: twelveMonthsAgo, endDate: monthEnd, limit: 999 }),
        listFinancialEntries({ limit: 10 }),
      ])
      setMonthEntries(month.data ?? [])
      setAllEntries(all.data ?? [])
      setRecentEntries(recent.data ?? [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const todayStr = now.toISOString().split("T")[0]

  const dayRec = monthEntries.filter(e => {
    const d = (e.created_at || "").split("T")[0]
    return d === todayStr && e.entry_type === "RECEITA" && e.is_paid
  }).reduce((s, e) => s + Number(e.amount), 0)
  const dayDesp = monthEntries.filter(e => {
    const d = (e.created_at || "").split("T")[0]
    return d === todayStr && (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid
  }).reduce((s, e) => s + Number(e.amount), 0)

  const weekRec = monthEntries.filter(e => {
    const d = (e.created_at || "").split("T")[0]
    return d >= weekStart && d <= weekEnd && e.entry_type === "RECEITA" && e.is_paid
  }).reduce((s, e) => s + Number(e.amount), 0)
  const weekDesp = monthEntries.filter(e => {
    const d = (e.created_at || "").split("T")[0]
    return d >= weekStart && d <= weekEnd && (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid
  }).reduce((s, e) => s + Number(e.amount), 0)

  const monthRec = monthEntries.filter(e => e.entry_type === "RECEITA" && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const monthDesp = monthEntries.filter(e => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)

  const yearRec = allEntries.filter(e => {
    const d = (e.created_at || "").split("T")[0]
    return d >= yearStart && d <= yearEnd && e.entry_type === "RECEITA" && e.is_paid
  }).reduce((s, e) => s + Number(e.amount), 0)
  const yearDesp = allEntries.filter(e => {
    const d = (e.created_at || "").split("T")[0]
    return d >= yearStart && d <= yearEnd && (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid
  }).reduce((s, e) => s + Number(e.amount), 0)

  const totalRec = allEntries.filter(e => e.entry_type === "RECEITA" && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const totalDesp = allEntries.filter(e => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)

  // Monthly flow for last 12 months
  const monthlyFlow: Record<string, { receitas: number; despesas: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyFlow[key] = { receitas: 0, despesas: 0 }
  }
  for (const entry of allEntries) {
    if (!entry.is_paid) continue
    const d = new Date(entry.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (monthlyFlow[key]) {
      if (entry.entry_type === "RECEITA") monthlyFlow[key].receitas += Number(entry.amount)
      else if (entry.entry_type === "DESPESA" || entry.entry_type === "CUSTO") monthlyFlow[key].despesas += Number(entry.amount)
    }
  }

  const maxMonthly = Math.max(...Object.values(monthlyFlow).map(d => Math.max(d.receitas, d.despesas)), 1)
  const flowArray = Object.entries(monthlyFlow)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#006B2E] border-t-transparent" />
      </div>
    )
  }

  const kpiCard = (label: string, receitas: number, despesas: number, icon: any) => {
    const balance = receitas - despesas
    return (
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#526157] mb-1">{icon}<span className="text-xs font-bold uppercase">{label}</span></div>
        <div className={`text-xl font-black ${balance >= 0 ? "text-[#006B2E]" : "text-red-700"}`}>{fmt(balance)}</div>
        <div className="flex gap-3 mt-1 text-[10px]">
          <span className="text-[#006B2E]">+{fmt(receitas)}</span>
          <span className="text-red-500">-{fmt(despesas)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {kpiCard("Saldo do Dia", dayRec, dayDesp, <DollarSign className="h-4 w-4" />)}
        {kpiCard("Saldo da Semana", weekRec, weekDesp, <Calendar className="h-4 w-4" />)}
        {kpiCard("Saldo do Mês", monthRec, monthDesp, <BarChart3 className="h-4 w-4" />)}
        {kpiCard("Saldo do Ano", yearRec, yearDesp, <TrendingUp className="h-4 w-4" />)}
        {kpiCard("Saldo Total", totalRec, totalDesp, <TrendingDown className="h-4 w-4" />)}
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#102016] flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#006B2E]" />Receitas vs Despesas (12 meses)
        </h2>
        <div className="flex items-end gap-1.5 h-48 overflow-x-auto pb-2">
          {flowArray.map(([month, data]) => {
            const maxH = 160
            const recH = Math.max((data.receitas / maxMonthly) * maxH, data.receitas > 0 ? 4 : 0)
            const despH = Math.max((data.despesas / maxMonthly) * maxH, data.despesas > 0 ? 4 : 0)
            const saldo = data.receitas - data.despesas
            return (
              <div key={month} className="flex-1 min-w-[48px] flex flex-col items-center gap-1">
                <div className="w-full flex flex-row items-end justify-center gap-0.5" style={{ height: `${maxH}px` }}>
                  <div
                    className="w-[40%] rounded-t bg-[#006B2E] transition-all"
                    style={{ height: `${recH}px` }}
                    title={`Receitas: ${fmt(data.receitas)}`}
                  />
                  <div
                    className="w-[40%] rounded-t bg-red-400 transition-all"
                    style={{ height: `${despH}px` }}
                    title={`Despesas: ${fmt(data.despesas)}`}
                  />
                </div>
                <span className="text-[10px] text-[#8c9c91] font-medium">{shortMonth(month)}</span>
                <span className={`text-[9px] font-mono ${saldo >= 0 ? "text-[#006B2E]" : "text-red-600"}`}>
                  {fmt(saldo)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 text-xs text-[#526157]">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#006B2E]" /> Receitas</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-400" /> Despesas</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#526157]" /> Saldo</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#102016] mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#006B2E]" />Transações Recentes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Data</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Descrição</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Valor</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f0]">
              {recentEntries.map((e: any) => (
                <tr key={e.id} className="hover:bg-[#fcfdfa]">
                  <td className="px-4 py-3 text-[#526157] whitespace-nowrap">{fmtDate(e.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-[#102016] max-w-[200px] truncate">{e.description || "-"}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${e.entry_type === "RECEITA" ? "text-[#006B2E]" : "text-red-600"}`}>
                    {e.entry_type === "RECEITA" ? "+" : "-"}{fmt(e.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${e.entry_type === "RECEITA" ? "text-[#006B2E]" : "text-red-600"}`}>
                      {e.entry_type === "RECEITA" ? "Receita" : e.entry_type === "DESPESA" ? "Despesa" : "Custo"}
                    </span>
                  </td>
                </tr>
              ))}
              {recentEntries.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[#8c9c91]">Nenhuma transação encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Mês</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Receitas</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Despesas</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {flowArray.map(([month, data]) => {
              const saldo = data.receitas - data.despesas
              return (
                <tr key={month} className="hover:bg-[#fcfdfa]">
                  <td className="px-4 py-3 font-medium text-[#102016]">{shortMonth(month)} {month.slice(0, 4)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#006B2E]">{fmt(data.receitas)}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600">{fmt(data.despesas)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${saldo >= 0 ? "text-[#006B2E]" : "text-red-700"}`}>{fmt(saldo)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function FluxoCaixaTab() {
  return <FluxoCaixaTabContent />
}
