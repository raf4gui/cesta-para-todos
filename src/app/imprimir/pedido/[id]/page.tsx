import { notFound } from "next/navigation"
import { getOrder } from "@/lib/services/orders"
import { getStoreSettings } from "@/app/admin/configuracoes/actions"
import { renderA4PrintHtml } from "@/lib/print-order-a4"

export const dynamic = "force-dynamic"

export default async function ImprimirPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let data
  try {
    data = await getOrder(id)
  } catch {
    notFound()
  }

  const { order, items } = data
  const store = await getStoreSettings()

  // Print visibility toggles from store settings
  const printSettings = {
    show_logo: store.print_show_logo,
    show_notes: store.print_show_notes,
    show_phone: store.print_show_phone,
    show_address: store.print_show_address,
    show_qrcode: store.print_show_qrcode,
  }

  const html = renderA4PrintHtml(order, items, store)

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
