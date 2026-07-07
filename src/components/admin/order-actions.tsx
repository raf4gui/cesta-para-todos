"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatus, updatePaymentStatus, addOrderNote } from "@/app/admin/pedidos/actions"
import { Textarea } from "@/components/ui/textarea"
import { FileText, ExternalLink } from "lucide-react"
import Link from "next/link"

const STATUS_OPTIONS = [
  "AGUARDANDO_CONTATO", "EM_NEGOCIACAO", "PAGAMENTO_CONFIRMADO",
  "EM_MONTAGEM", "EM_ENTREGA", "FINALIZADO", "CANCELADO",
]

const PAYMENT_OPTIONS = ["PENDENTE", "CONFIRMADO", "CANCELADO"]

export function OrderActions({ order }: { order: any }) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState("")

  const handleUpdateStatus = async () => {
    setSaving(true)
    try {
      await updateOrderStatus(order.id, status)
      setFeedback("Status atualizado!")
      if (status === "FINALIZADO" && paymentStatus === "CONFIRMADO") {
        router.push(`/admin/pedidos/${order.id}?finalizado=true`)
        return
      }
      router.refresh()
    } catch (e: any) {
      setFeedback(e.message)
    }
    setSaving(false)
  }

  const handleUpdatePayment = async () => {
    setSaving(true)
    try {
      await updatePaymentStatus(order.id, paymentStatus)
      setFeedback("Status de pagamento atualizado!")
    } catch (e: any) {
      setFeedback(e.message)
    }
    setSaving(false)
    router.refresh()
  }

  const handleAddNote = async () => {
    if (!note.trim()) return
    try {
      await addOrderNote(order.id, note)
      setNote("")
      setFeedback("Anotação adicionada!")
      router.refresh()
    } catch (e: any) {
      setFeedback(e.message)
    }
  }

  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-5">
      <h3 className="text-sm font-bold text-[#102016]">Ações</h3>

      {feedback && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
          {feedback}
        </div>
      )}

      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#526157]">Status do Pedido</label>
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleUpdateStatus} disabled={saving} className="bg-[#006B2E] text-white hover:bg-[#005324]">
            {saving ? "..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#526157]">Status de Pagamento</label>
        <div className="flex gap-2">
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleUpdatePayment} disabled={saving} className="bg-[#006B2E] text-white hover:bg-[#005324]">
            {saving ? "..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[#dfe7dd]">
        <label className="text-xs font-semibold text-[#526157]">Nota Fiscal</label>
        <Link href="/admin/nfe" target="_blank">
          <Button size="sm" variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Gerenciar Notas Fiscais
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#526157]">Adicionar Anotação</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Observação interna..."
          rows={2}
        />
        <Button size="sm" variant="outline" onClick={handleAddNote} disabled={!note.trim()}>
          Adicionar
        </Button>
      </div>
    </div>
  )
}
