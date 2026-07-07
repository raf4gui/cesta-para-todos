import { notFound } from "next/navigation"
import { getOrder } from "@/lib/services/orders"
import { getStoreSettings } from "@/app/admin/configuracoes/actions"
import { renderThermalPrintHtml } from "@/lib/print-order-thermal"

export const dynamic = "force-dynamic"

export default async function ImprimirTermica80Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let data
  try {
    data = await getOrder(id)
  } catch {
    notFound()
  }

  const { order, items } = data
  const store = await getStoreSettings()
  const html = renderThermalPrintHtml(order, items, store, {
    width: "80mm",
    fontSize: 12,
    showLogo: store.print_show_logo !== false,
    showPhone: store.print_show_phone !== false,
    showAddress: store.print_show_address !== false,
    showNotes: store.print_show_notes !== false,
  })

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
