"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Plus, Pause, Play, XCircle, Pencil, Trash2 } from "lucide-react"
import { listRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } from "@/app/admin/financeiro/actions"

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }

const EXPENSE_CATEGORIES = [
  "Aluguel", "Combustível", "Fornecedor", "Energia", "Água", "Internet",
  "Funcionário", "Manutenção", "Marketing", "Seguros", "Impostos", "Pró-Labore",
  "Telefone", "Material de Escritório", "Transporte", "Alimentação", "Outras Despesas",
]

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Transferência", "Cheque", "Depósito"]
const FREQUENCIAS = [
  { value: "mensal", label: "Mensal" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
]

interface RecurringForm {
  nome: string; categoria: string; valor: string; data_vencimento: string; frequencia: string; forma_pagamento: string; observacao: string
}

const defaultForm: RecurringForm = { nome: "", categoria: "", valor: "", data_vencimento: "1", frequencia: "mensal", forma_pagamento: "", observacao: "" }

const statusBadge = (s: string) => {
  if (s === "ativa") return <Badge className="bg-green-100 text-green-700 border-green-200">Ativa</Badge>
  if (s === "pausada") return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pausada</Badge>
  return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelada</Badge>
}

function formatNextGen(d: string | null) {
  if (!d) return "-"
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR")
}

function computeNextGen(dueDay: number, frequency: string): string {
  const today = new Date()
  let next = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (next <= today) {
    if (frequency === "mensal") next.setMonth(next.getMonth() + 1)
    else if (frequency === "semanal") next.setDate(next.getDate() + 7)
    else if (frequency === "quinzenal") next.setDate(next.getDate() + 15)
    else if (frequency === "bimestral") next.setMonth(next.getMonth() + 2)
    else if (frequency === "trimestral") next.setMonth(next.getMonth() + 3)
    else if (frequency === "semestral") next.setMonth(next.getMonth() + 6)
    else if (frequency === "anual") next.setFullYear(next.getFullYear() + 1)
  }
  return next.toISOString().split("T")[0]
}

function RecorrentesTabContent() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<RecurringForm>(defaultForm)
  const [editing, setEditing] = useState<any>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listRecurringExpenses()
      setItems(data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalMensal = items.filter(i => i.status === "ativa").reduce((s, i) => {
    if (i.frequencia === "mensal") return s + Number(i.valor)
    if (i.frequencia === "semanal") return s + Number(i.valor) * 4.33
    if (i.frequencia === "quinzenal") return s + Number(i.valor) * 2
    if (i.frequencia === "bimestral") return s + Number(i.valor) / 2
    if (i.frequencia === "trimestral") return s + Number(i.valor) / 3
    if (i.frequencia === "semestral") return s + Number(i.valor) / 6
    if (i.frequencia === "anual") return s + Number(i.valor) / 12
    return s + Number(i.valor)
  }, 0)
  const qtdAtivas = items.filter(i => i.status === "ativa").length
  const qtdPausadas = items.filter(i => i.status === "pausada").length

  const handleCreate = async () => {
    try {
      const dueDay = parseInt(form.data_vencimento)
      const nextGen = computeNextGen(dueDay, form.frequencia)
      await createRecurringExpense({
        nome: form.nome,
        categoria: form.categoria,
        valor: Number(form.valor),
        data_vencimento: dueDay,
        frequencia: form.frequencia as any,
        forma_pagamento: form.forma_pagamento,
        observacao: form.observacao,
        status: "ativa",
      })
      setShowCreate(false)
      setForm(defaultForm)
      setFeedback("Despesa recorrente criada!")
      fetchData()
      setTimeout(() => setFeedback(null), 2000)
    } catch (e: any) {
      setFeedback(e.message || "Erro ao criar")
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateRecurringExpense(id, { status: status as any })
      setFeedback(`Status alterado para ${status}`)
      fetchData()
      setTimeout(() => setFeedback(null), 2000)
    } catch {}
  }

  const handleUpdate = async () => {
    if (!editing) return
    try {
      await updateRecurringExpense(editing.id, {
        nome: editing.nome,
        categoria: editing.categoria,
        valor: Number(editing.valor),
        data_vencimento: parseInt(editing.data_vencimento),
        frequencia: editing.frequencia,
        forma_pagamento: editing.forma_pagamento,
        observacao: editing.observacao,
      })
      setEditing(null)
      setFeedback("Despesa atualizada!")
      fetchData()
      setTimeout(() => setFeedback(null), 2000)
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta despesa recorrente?")) return
    try {
      await deleteRecurringExpense(id)
      setFeedback("Despesa excluída!")
      fetchData()
      setTimeout(() => setFeedback(null), 2000)
    } catch {}
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{feedback}</div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#526157]">Total Mensal</p>
          <p className="text-xl font-black text-[#006B2E]">{fmt(totalMensal)}</p>
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#526157]">Ativas</p>
          <p className="text-xl font-black text-green-600">{qtdAtivas}</p>
        </div>
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#526157]">Pausadas</p>
          <p className="text-xl font-black text-amber-600">{qtdPausadas}</p>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogTrigger render={<Button className="bg-[#006B2E] text-white hover:bg-[#005324] h-10" />}>
            <Plus className="h-4 w-4 mr-2" />Nova Despesa Recorrente
          </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-[#102016]">Nova Despesa Recorrente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#526157] mb-1">Nome *</label>
              <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" placeholder="Nome da despesa" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                  <option value="">Selecione...</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" placeholder="0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Dia Vencimento *</label>
                <input type="number" min="1" max="31" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Frequência *</label>
                <select value={form.frequencia} onChange={e => setForm({ ...form, frequencia: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                  {FREQUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#526157] mb-1">Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                  <option value="">Selecione...</option>
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#526157] mb-1">Observação</label>
              <textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })}
                className="w-full rounded-md border border-[#dfe7dd] px-3 py-2 text-sm min-h-[60px]" placeholder="Observações..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button className="bg-[#006B2E] text-white hover:bg-[#005324]" disabled={!form.nome || !form.valor} onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#006B2E] border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Nome</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Categoria</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Valor</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Vencimento</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Frequência</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Próx. Geração</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f0]">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-[#fcfdfa]">
                  <td className="px-4 py-3 font-medium text-[#102016]">{item.nome || "-"}</td>
                  <td className="px-4 py-3 text-[#526157]">{item.categoria || "-"}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{fmt(Number(item.valor))}</td>
                  <td className="px-4 py-3 text-[#526157]">Dia {item.data_vencimento}</td>
                  <td className="px-4 py-3 text-[#8c9c91] capitalize">{item.frequencia}</td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-[#526157]">{formatNextGen(item.next_generation)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 min-h-[44px] items-center">
                      {item.status === "ativa" ? (
                        <button onClick={() => handleUpdateStatus(item.id, "pausada")} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-amber-50 text-amber-600" title="Pausar">
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : item.status === "pausada" ? (
                        <button onClick={() => handleUpdateStatus(item.id, "ativa")} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-green-50 text-green-600" title="Ativar">
                          <Play className="h-4 w-4" />
                        </button>
                      ) : null}
                      {item.status !== "cancelada" && (
                        <button onClick={() => handleUpdateStatus(item.id, "cancelada")} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-red-50 text-red-600" title="Cancelar">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setEditing({ ...item })} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[#f0f4f0] text-[#526157]" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-red-50 text-red-500" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#8c9c91]">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-[#102016]">Editar Despesa Recorrente</DialogTitle></DialogHeader>
            {editing && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Nome</label>
                <input type="text" value={editing.nome} onChange={e => setEditing({ ...editing, nome: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Categoria</label>
                  <select value={editing.categoria} onChange={e => setEditing({ ...editing, categoria: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                    <option value="">Selecione...</option>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={editing.valor} onChange={e => setEditing({ ...editing, valor: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Dia Vencimento</label>
                  <input type="number" min="1" max="31" value={editing.data_vencimento} onChange={e => setEditing({ ...editing, data_vencimento: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#526157] mb-1">Frequência</label>
                  <select value={editing.frequencia} onChange={e => setEditing({ ...editing, frequencia: e.target.value })}
                    className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                    {FREQUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Forma de Pagamento</label>
                <select value={editing.forma_pagamento} onChange={e => setEditing({ ...editing, forma_pagamento: e.target.value })}
                  className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
                  <option value="">Selecione...</option>
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#526157] mb-1">Observação</label>
                <textarea value={editing.observacao} onChange={e => setEditing({ ...editing, observacao: e.target.value })}
                  className="w-full rounded-md border border-[#dfe7dd] px-3 py-2 text-sm min-h-[60px]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button className="bg-[#006B2E] text-white hover:bg-[#005324]" onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function RecorrentesTab() {
  return <RecorrentesTabContent />
}
