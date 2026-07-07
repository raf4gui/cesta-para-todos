"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, PiggyBank, Wallet, BarChart3, Pencil, Trash2, Search } from "lucide-react"
import { createFinancialEntry, listFinancialEntries, updateFinancialEntry, deleteFinancialEntry } from "@/app/admin/financeiro/actions"

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }
function fmtDate(d: string) { return d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "-" }
function today() { return new Date().toISOString().split("T")[0] }

const EXPENSE_CATEGORIES = [
  "Aluguel", "Combustível", "Fornecedor", "Energia", "Água", "Internet",
  "Funcionário", "Manutenção", "Marketing", "Seguros", "Impostos", "Pró-Labore",
  "Telefone", "Material de Escritório", "Transporte", "Alimentação", "Outras Despesas",
]

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Transferência", "Cheque", "Depósito"]

interface Filters {
  entryType: string; isPaid: string; startDate: string; endDate: string; category: string; paymentMethod: string; search: string
}

interface EditForm {
  id: string; entry_type: string; amount: string; category: string; description: string; payment_method: string; due_date: string; is_paid: boolean; recurring: boolean; recurring_interval: string
}

function LancamentosTabContent() {
  const [entries, setEntries] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({ entryType: "", isPaid: "", startDate: "", endDate: "", category: "", paymentMethod: "", search: "" })
  const [editing, setEditing] = useState<EditForm | null>(null)
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const limit = 20

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listFinancialEntries({ page, limit, ...filters })
      setEntries(result.data)
      setTotal(result.total)
    } catch {} finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const [monthEntries, setMonthEntries] = useState<any[]>([])
  useEffect(() => {
    listFinancialEntries({ startDate: monthStart, endDate: monthEnd, limit: 500 }).then(r => setMonthEntries(r.data ?? [])).catch(() => {})
  }, [])

  const monthReceitas = monthEntries.filter(e => e.entry_type === "RECEITA" && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const monthDespesas = monthEntries.filter(e => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const monthPendingReceitas = monthEntries.filter(e => e.entry_type === "RECEITA" && !e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const monthPendingDespesas = monthEntries.filter(e => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && !e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const lucroMensal = monthReceitas - monthDespesas

  const allTimeReceitas = entries.filter(e => e.entry_type === "RECEITA" && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const allTimeDespesas = entries.filter(e => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const saldoAtual = allTimeReceitas - allTimeDespesas

  const expensesByCategory: Record<string, number> = {}
  for (const entry of monthEntries) {
    if ((entry.entry_type === "DESPESA" || entry.entry_type === "CUSTO") && entry.is_paid) {
      const cat = entry.category || "Outras"
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(entry.amount)
    }
  }
  const categoryBreakdown = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a).slice(0, 8)
  const maxCategory = Math.max(...categoryBreakdown.map(([, v]) => v), 1)

  const totalPages = Math.ceil(total / limit)

  const handleEdit = (entry: any) => {
    setEditing({
      id: entry.id,
      entry_type: entry.entry_type,
      amount: String(entry.amount),
      category: entry.category || "",
      description: entry.description || "",
      payment_method: entry.payment_method || "",
      due_date: entry.due_date || "",
      is_paid: entry.is_paid,
      recurring: entry.recurring || false,
      recurring_interval: entry.recurring_interval || "",
    })
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await updateFinancialEntry(editing.id, {
        entry_type: editing.entry_type,
        amount: Number(editing.amount),
        category: editing.category,
        description: editing.description,
        payment_method: editing.payment_method,
        due_date: editing.due_date,
        is_paid: editing.is_paid,
        recurring: editing.recurring,
        recurring_interval: editing.recurring_interval,
      })
      setEditing(null)
      setFeedback("Lançamento atualizado!")
      fetchEntries()
      setTimeout(() => setFeedback(null), 2000)
    } catch (e: any) {
      setFeedback(e.message || "Erro ao atualizar")
    }
  }

  const handleCreate = async () => {
    if (!creating) return
    try {
      await createFinancialEntry({
        entry_type: "DESPESA",
        amount: 0,
        is_paid: true,
      })
      setCreating(false)
      fetchEntries()
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return
    try {
      await deleteFinancialEntry(id)
      setFeedback("Lançamento excluído!")
      fetchEntries()
      setTimeout(() => setFeedback(null), 2000)
    } catch {}
  }

  const resetFilters = () => {
    setFilters({ entryType: "", isPaid: "", startDate: "", endDate: "", category: "", paymentMethod: "", search: "" })
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{feedback}</div>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#006B2E] mb-1"><TrendingUp className="h-4 w-4" /><span className="text-xs font-bold uppercase">Receitas (Mês)</span></div>
          <div className="text-xl font-black text-[#006B2E]">{fmt(monthReceitas)}</div>
          {monthPendingReceitas > 0 && <p className="text-xs text-[#8c9c91] mt-1">{fmt(monthPendingReceitas)} pendentes</p>}
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-1"><TrendingDown className="h-4 w-4" /><span className="text-xs font-bold uppercase">Despesas (Mês)</span></div>
          <div className="text-xl font-black text-red-700">{fmt(monthDespesas)}</div>
          {monthPendingDespesas > 0 && <p className="text-xs text-[#8c9c91] mt-1">{fmt(monthPendingDespesas)} pendentes</p>}
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#102016] mb-1"><PiggyBank className="h-4 w-4" /><span className="text-xs font-bold uppercase">Lucro Líquido</span></div>
          <div className={`text-xl font-black ${lucroMensal >= 0 ? "text-[#006B2E]" : "text-red-700"}`}>{fmt(lucroMensal)}</div>
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#526157] mb-1"><Wallet className="h-4 w-4" /><span className="text-xs font-bold uppercase">Saldo Total</span></div>
          <div className={`text-xl font-black ${saldoAtual >= 0 ? "text-[#006B2E]" : "text-red-700"}`}>{fmt(saldoAtual)}</div>
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#102016] flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[#006B2E]" />Despesas por Categoria (Mês)</h2>
          <div className="space-y-2">
            {categoryBreakdown.map(([cat, value]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm text-[#526157] w-32 truncate shrink-0">{cat}</span>
                <div className="flex-1 h-5 rounded-full bg-[#f0f4f0] overflow-hidden">
                  <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${(value / maxCategory) * 100}%` }} />
                </div>
                <span className="text-sm font-mono font-bold text-red-600 w-24 text-right shrink-0">{fmt(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Período</label>
            <div className="flex gap-2">
              <Input type="date" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1) }} className="h-9 w-36 text-xs" />
              <Input type="date" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1) }} className="h-9 w-36 text-xs" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Tipo</label>
            <select value={filters.entryType} onChange={e => { setFilters(f => ({ ...f, entryType: e.target.value })); setPage(1) }} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="">Todos</option><option value="RECEITA">Receitas</option><option value="DESPESA">Despesas</option><option value="CUSTO">Custos</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Status</label>
            <select value={filters.isPaid} onChange={e => { setFilters(f => ({ ...f, isPaid: e.target.value })); setPage(1) }} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="">Todos</option><option value="true">Pago</option><option value="false">Pendente</option><option value="overdue">Atrasado</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Categoria</label>
            <select value={filters.category} onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1) }} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="">Todas</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Pagamento</label>
            <select value={filters.paymentMethod} onChange={e => { setFilters(f => ({ ...f, paymentMethod: e.target.value })); setPage(1) }} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="">Todas</option>
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
              <input type="text" value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }} placeholder="Descrição..."
                className="h-9 rounded-md border border-[#dfe7dd] pl-8 pr-3 text-sm w-40" />
            </div>
          </div>
          <Button variant="outline" className="h-9 text-xs" onClick={resetFilters}>Limpar</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#006B2E] border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#526157] w-4" />
                <th className="px-4 py-3 font-semibold text-[#526157]">Data</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Descrição</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Categoria</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Valor</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Pagamento</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f0]">
              {entries.map((entry: any) => {
                const isVencido = !entry.is_paid && entry.due_date && entry.due_date < today()
                const isVenceHoje = !entry.is_paid && entry.due_date === today()
                return (
                  <tr key={entry.id} className="hover:bg-[#fcfdfa]">
                    <td className="px-4 py-3">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${entry.entry_type === "RECEITA" ? "bg-green-500" : "bg-red-500"}`} />
                    </td>
                    <td className="px-4 py-3 text-[#526157] whitespace-nowrap">{fmtDate(entry.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-[#102016] max-w-[200px] truncate">{entry.description || "-"}</td>
                    <td className="px-4 py-3 text-[#8c9c91]">{entry.category || "-"}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${entry.entry_type === "RECEITA" ? "text-[#006B2E]" : "text-red-600"}`}>{fmt(entry.amount)}</td>
                    <td className="px-4 py-3 text-[#526157]">{entry.payment_method || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isVencido ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200 font-bold">Vencido</Badge>
                        ) : isVenceHoje ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">Vence Hoje</Badge>
                        ) : entry.is_paid ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Pago</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>
                        )}
                        {entry.due_date && entry.due_date !== entry.created_at?.split("T")[0] && (
                          <span className="text-[10px] text-[#8c9c91]">Venc: {fmtDate(entry.due_date)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 min-h-[44px] items-center">
                        <button onClick={() => handleEdit(entry)} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[#f0f4f0] text-[#526157]" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-red-50 text-red-500" title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#8c9c91]">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-[#526157]">{total} lançamento(s)</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-9 min-w-[44px]">Anterior</Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, page - 2)
            const p = start + i
            if (p > totalPages) return null
            return (
              <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)} className={`h-9 min-w-[44px] ${p === page ? "bg-[#006B2E] text-white" : ""}`}>
                {p}
              </Button>
            )
          })}
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-9 min-w-[44px]">Próximo</Button>
        </div>
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-[#526157] mb-2">Categorias de despesa:</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPENSE_CATEGORIES.map(cat => (
            <Link key={cat} href={`/admin/financeiro/novo?type=DESPESA&category=${encodeURIComponent(cat)}`}
              className="px-2.5 py-1 rounded-full bg-[#fcfdfa] border border-[#dfe7dd] text-xs text-[#526157] hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors min-h-[28px] flex items-center">
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-[#102016]">Editar Lançamento</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Tipo</label>
                  <select value={editing.entry_type} onChange={e => setEditing({ ...editing, entry_type: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                    <option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option><option value="CUSTO">Custo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={editing.amount} onChange={e => setEditing({ ...editing, amount: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Descrição</label>
                <input type="text" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" placeholder="Descrição" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Categoria</label>
                  <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                    <option value="">Selecione...</option>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Forma Pagamento</label>
                  <select value={editing.payment_method} onChange={e => setEditing({ ...editing, payment_method: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                    <option value="">Selecione...</option>
                    {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Data Vencimento</label>
                  <input type="date" value={editing.due_date} onChange={e => setEditing({ ...editing, due_date: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.is_paid} onChange={e => setEditing({ ...editing, is_paid: e.target.checked })}
                      className="h-4 w-4 rounded border-[#dfe7dd] text-[#006B2E] focus:ring-[#006B2E]" />
                    <span className="text-sm font-medium text-[#102016]">Pago</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.recurring} onChange={e => setEditing({ ...editing, recurring: e.target.checked })}
                    className="h-4 w-4 rounded border-[#dfe7dd] text-[#006B2E] focus:ring-[#006B2E]" />
                  <span className="text-sm font-medium text-[#102016]">Recorrente</span>
                </label>
                {editing.recurring && (
                  <select value={editing.recurring_interval} onChange={e => setEditing({ ...editing, recurring_interval: e.target.value })}
                    className="mt-2 w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                    <option value="">Selecione frequência</option>
                    <option value="mensal">Mensal</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button className="bg-[#006B2E] text-white hover:bg-[#005324]" onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function LancamentosTab() {
  return <LancamentosTabContent />
}
