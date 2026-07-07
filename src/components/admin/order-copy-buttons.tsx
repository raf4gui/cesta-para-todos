"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, ClipboardCheck } from "lucide-react"

interface CopyButtonsProps {
  order: any
  items: any[]
}

export function OrderCopyButtons({ order, items }: CopyButtonsProps) {
  const [feedback, setFeedback] = useState("")
  const customer = order.customer

  const formatCurrency = (v: number | string) =>
    "R$ " + Number(v || 0).toFixed(2).replace(".", ",")

  const buildFullText = () => {
    const lines = [
      `Pedido: ${order.protocol || ""}`,
      `Cliente: ${customer?.name || "-"}`,
      `Telefone: ${customer?.phone || "-"}`,
      `Tipo: ${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}`,
      `Pagamento: ${order.payment_method || "A combinar"}`,
    ]
    if (order.delivery_address) {
      lines.push(`Endereço: ${order.delivery_address}`)
    }
    if (customer?.address) {
      lines.push(`Endereço do Cliente: ${customer.address}${customer.city ? ` - ${customer.city}` : ""}`)
    }
    lines.push("")
    lines.push("--- ITENS ---")
    items.forEach((i: any) => {
      const brand = i.chosen_brand?.name || i.product?.brand?.name || "-"
      lines.push(`${i.quantity}x ${i.name || i.product?.name || "Item"} - Marca: ${brand} - ${formatCurrency(i.total_price)}`)
    })
    lines.push("")
    lines.push(`Total: ${formatCurrency(order.total_value || 0)}`)
    if (order.notes) {
      lines.push("")
      lines.push(`Observações: ${order.notes}`)
    }
    return lines.join("\n")
  }

  const buildProductsText = () => {
    const lines: string[] = []
    items.forEach((i: any) => {
      const brand = i.chosen_brand?.name || i.product?.brand?.name || "-"
      lines.push(`${i.quantity}x ${i.name || i.product?.name || "Item"} - ${brand}`)
    })
    return lines.join("\n")
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setFeedback(`${label} copiado!`)
    } catch {
      setFeedback("Erro ao copiar.")
    }
    setTimeout(() => setFeedback(""), 3000)
  }

  return (
    <div className="space-y-2">
      {feedback && (
        <div className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
          {feedback}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => copyToClipboard(buildFullText(), "Pedido")}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar Pedido
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => copyToClipboard(buildProductsText(), "Produtos")}
        >
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Copiar Produtos
        </Button>
      </div>
    </div>
  )
}
