"use client"

import { useEffect } from "react"
import { markOrderAsViewed } from "@/app/admin/pedidos/actions"

export function MarkOrderViewed({ orderId }: { orderId: string }) {
  useEffect(() => {
    markOrderAsViewed(orderId)
  }, [orderId])
  return null
}
