"use client"

import { Check, Clock, X, Truck, Package, DollarSign } from "lucide-react"
import { formatDateTime } from "@/lib/services/base"

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  AGUARDANDO_CONTATO: { label: "Aguardando Contato", icon: Clock, color: "text-amber-500" },
  EM_NEGOCIACAO: { label: "Em Negociação", icon: DollarSign, color: "text-blue-500" },
  PAGAMENTO_CONFIRMADO: { label: "Pagamento Confirmado", icon: Check, color: "text-green-500" },
  EM_MONTAGEM: { label: "Em Montagem", icon: Package, color: "text-purple-500" },
  EM_ENTREGA: { label: "Em Entrega", icon: Truck, color: "text-indigo-500" },
  FINALIZADO: { label: "Finalizado", icon: Check, color: "text-green-600" },
  CANCELADO: { label: "Cancelado", icon: X, color: "text-red-500" },
}

export function OrderTimeline({ history }: { history: any[] }) {
  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-[#102016]">Linha do Tempo</h3>
      <div className="space-y-0">
        {history.map((h: any, i: number) => {
          const config = STATUS_CONFIG[h.new_status] || { label: h.new_status, icon: Clock, color: "text-gray-500" }
          const Icon = config.icon
          return (
            <div key={h.id} className="flex gap-3 pb-4 relative">
              {i < history.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-[#dfe7dd]" />}
              <div className={`shrink-0 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center ${config.color} border-current mt-0.5`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#102016]">{config.label}</div>
                <div className="text-xs text-[#8c9c91]">{formatDateTime(h.changed_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
