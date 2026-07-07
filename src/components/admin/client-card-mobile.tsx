"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/services/base"
import { Phone, MapPin, CreditCard, ShoppingBag, ChevronRight } from "lucide-react"

interface Customer {
  id: string; name: string; phone: string; whatsapp?: string
  cpf_cnpj?: string; city?: string; purchase_count: number
  total_spent: number; ativo: boolean; created_at: string; notes?: string
}

export function ClientCardMobile({ customer }: { customer: Customer }) {
  return (
    <Link href={`/admin/clientes/${customer.id}`} className="block rounded-xl border border-[#dfe7dd] bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#102016] truncate">{customer.name}</h3>
              <Badge variant={customer.ativo ? "default" : "secondary"} className={`shrink-0 text-[10px] ${customer.ativo ? "bg-green-100 text-green-700" : ""}`}>
                {customer.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#8c9c91] shrink-0 ml-2" />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#526157]">
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>
          {customer.cpf_cnpj && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {customer.cpf_cnpj}</span>}
          {customer.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {customer.city}</span>}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#f0f4f0]">
          <div className="flex items-center gap-3 text-xs text-[#526157]">
            <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {customer.purchase_count} compras</span>
            <span className="font-mono font-semibold text-[#102016]">{formatCurrency(customer.total_spent)}</span>
          </div>
          <span className="text-[10px] text-[#8c9c91]">{formatDate(customer.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
