"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRealtime } from "@/lib/realtime-context"
import { formatCurrency } from "@/lib/services/base"
import { ShoppingBag, X } from "lucide-react"

export function OrderNotification() {
  const { latestNewOrder, consumeNewOrder } = useRealtime()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (latestNewOrder && !dismissed) {
      setVisible(true)
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        setDismissed(false)
        consumeNewOrder()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [latestNewOrder, dismissed, consumeNewOrder])

  if (!visible || !latestNewOrder) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-right-2 fade-in duration-300">
      <div className="rounded-xl border border-green-200 bg-white shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-700">Novo Pedido Recebido</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Pedido <span className="font-mono font-semibold text-gray-700">{latestNewOrder.protocol}</span>
              {latestNewOrder.customer_name ? ` — ${latestNewOrder.customer_name}` : ""}
            </p>
            {latestNewOrder.total_value ? (
              <p className="text-xs font-semibold text-gray-600 mt-1">{formatCurrency(latestNewOrder.total_value)}</p>
            ) : null}
            <div className="mt-2">
              <Link
                href={`/admin/pedidos/${latestNewOrder.id}`}
                onClick={() => { setVisible(false); consumeNewOrder() }}
                className="inline-flex h-7 items-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Ver Pedido
              </Link>
            </div>
          </div>
          <button
            onClick={() => { setVisible(false); setDismissed(true); consumeNewOrder() }}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
