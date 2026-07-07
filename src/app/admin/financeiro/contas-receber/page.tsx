"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, CheckCircle2, XCircle, Receipt, Ban } from "lucide-react"
import { listContasReceber, marcarComoRecebido, getResumoContasReceber } from "@/app/admin/financeiro/contas-receber-actions"

function formatCurrency(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }
function formatDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR") }

interface Conta {
  id: string
  descricao: string
  valor: number
  data_vencimento: string
  data_recebimento: string | null
  status: string
  pedido_id: string | null
  cliente_id: string | null
  observacao: string | null
  cliente: { name: string } | null
  pedido: { protocol: string } | null
}

export default function ContasReceberPage() {
  const [contas, setContas] = useState<Conta[]>([])
  const [total, setTotal] = useState(0)
  const [resumo, setResumo] = useState({ totalAPagar: 0, totalRecebido: 0, totalVencido: 0 })
  const [status, setStatus] = useState("todos")
  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [recebendoId, setRecebendoId] = useState<string | null>(null)
  const [dataRecebimento, setDataRecebimento] = useState("")
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listContasReceber({ status, search, data_inicio: dataInicio, data_fim: dataFim })
      setContas(result.data as any)
      setTotal(result.total)
      const r = await getResumoContasReceber()
      setResumo(r)
    } catch { } finally { setLoading(false) }
  }, [status, search, dataInicio, dataFim])

  useEffect(() => { fetchData() }, [fetchData])

  const handleMarcarRecebido = async (id: string) => {
    const date = dataRecebimento || new Date().toISOString().split("T")[0]
    await marcarComoRecebido(id, date)
    setShowDatePicker(null)
    setRecebendoId(null)
    fetchData()
  }

  const today = new Date().toISOString().split("T")[0]

  const statusBadge = (s: string, vencimento: string) => {
    const vencido = s === "pendente" && vencimento < today
    if (s === "recebido") return <Badge className="bg-green-100 text-green-700 border-green-200">Recebido</Badge>
    if (s === "cancelado") return <Badge variant="destructive">Cancelado</Badge>
    if (vencido) return <Badge className="bg-red-100 text-red-700 border-red-200 font-bold">Vencido</Badge>
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>
  }

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Contas a Receber</h1>
          <p className="text-sm text-[#526157]">Gerencie os recebimentos do negócio</p>
        </div>
        <Link href="/admin/financeiro/novo?type=RECEITA">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]"><Plus className="h-4 w-4 mr-2" />Nova Conta a Receber</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs font-bold uppercase text-yellow-700">A Receber</p>
          <p className="text-xl font-black text-yellow-800">{formatCurrency(resumo.totalAPagar)}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-bold uppercase text-green-700">Recebido</p>
          <p className="text-xl font-black text-green-800">{formatCurrency(resumo.totalRecebido)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase text-red-700">Vencido</p>
          <p className="text-xl font-black text-red-800">{formatCurrency(resumo.totalVencido)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Descrição..."
                className="h-9 rounded-md border border-[#dfe7dd] pl-8 pr-3 text-sm w-48"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Vencimento Início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Vencimento Fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm" />
          </div>
          <Button variant="outline" className="h-9" onClick={fetchData}>Filtrar</Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[#8c9c91]">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Descrição</th>
                <th className="px-4 py-3 font-semibold text-[#526157] text-right">Valor</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Vencimento</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Recebimento</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Cliente / Pedido</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f0]">
              {contas.map(conta => {
                const vencido = conta.status === "pendente" && conta.data_vencimento < today
                return (
                  <tr key={conta.id} className="hover:bg-[#fcfdfa]">
                    <td className="px-4 py-3 font-medium text-[#102016] max-w-[200px] truncate">{conta.descricao || "-"}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${vencido ? "text-red-600" : conta.status === "recebido" ? "text-green-600" : "text-[#102016]"}`}>
                      {formatCurrency(Number(conta.valor))}
                    </td>
                    <td className={`px-4 py-3 font-mono ${vencido ? "text-red-600 font-bold" : "text-[#526157]"}`}>
                      {formatDate(conta.data_vencimento)}
                    </td>
                    <td className="px-4 py-3 text-[#526157]">
                      {conta.data_recebimento ? formatDate(conta.data_recebimento) : "-"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(conta.status, conta.data_vencimento)}</td>
                    <td className="px-4 py-3 text-[#526157]">
                      {conta.cliente?.name && <span className="block text-xs">{conta.cliente.name}</span>}
                      {conta.pedido?.protocol && <span className="text-xs text-[#8c9c91]">Pedido {conta.pedido.protocol}</span>}
                      {!conta.cliente && !conta.pedido && <span className="text-[#8c9c91]">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {conta.status === "pendente" && (
                          <button
                            onClick={() => setShowDatePicker(showDatePicker === conta.id ? null : conta.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Receber
                          </button>
                        )}
                        {conta.status === "pendente" && (
                          <button
                            onClick={async () => {
                              const { updateContaReceber } = await import("@/app/admin/financeiro/contas-receber-actions")
                              await updateContaReceber(conta.id, { status: "cancelado" })
                              fetchData()
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        )}
                      </div>
                      {/* Inline date picker */}
                      {showDatePicker === conta.id && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg border border-green-200 bg-green-50">
                          <input
                            type="date"
                            value={dataRecebimento}
                            onChange={e => setDataRecebimento(e.target.value)}
                            className="h-8 rounded-md border border-[#dfe7dd] px-2 text-xs flex-1"
                            defaultValue={today}
                          />
                          <Button size="sm" className="h-8 bg-[#006B2E] text-white text-xs" onClick={() => handleMarcarRecebido(conta.id)}>
                            Confirmar
                          </Button>
                          <button
                            onClick={() => setShowDatePicker(null)}
                            className="text-xs text-[#526157] hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {contas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#8c9c91]">Nenhuma conta a receber encontrada.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-sm text-[#526157]">Total: {total} contas a receber</div>
    </section>
  )
}
