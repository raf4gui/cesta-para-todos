import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrder } from "@/lib/services/orders"
import { listNfeEmissions } from "@/lib/services/nfe"
import { formatCurrency, formatDateTime } from "@/lib/services/base"
import { OrderActions } from "@/components/admin/order-actions"
import { OrderTimeline } from "@/components/admin/order-timeline"
import { DeleteOrderButton } from "@/components/admin/delete-order-button"
import { MarkOrderViewed } from "@/components/admin/mark-order-viewed"
import { OrderCopyButtons } from "@/components/admin/order-copy-buttons"
import { OrderFinalizedModal } from "@/components/admin/order-finalized-modal"
import { getStoreSettings } from "@/app/admin/configuracoes/actions"
import { Printer, MessageCircle, FileText, Eye, ArrowLeft, ChevronDown } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PedidoDetalhePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ finalizado?: string }> }) {
  const { id } = await params
  const { finalizado } = await searchParams
  let data
  try {
    data = await getOrder(id)
  } catch {
    notFound()
  }

  const { order, items, history, notes } = data
  if (!order) notFound()
  const customer = order.customer
  const whatsappPhone = customer?.whatsapp || customer?.phone || ""

  let invoices: any[] = []
  try { invoices = await listNfeEmissions(id) } catch { invoices = [] }

  let settings: any = {}
  try { settings = await getStoreSettings() } catch { settings = {} }
  const printerType = settings.printer_type || "a4"
  const shareMessage = [
    "*Pedido Finalizado!*",
    `Protocolo: ${order.protocol}`,
    `Cliente: ${customer?.name || "-"}`,
    `Telefone: ${customer?.phone || "-"}`,
    "",
    "*Itens:*",
    ...items.map((i: any) => {
      const brandStr = i.chosen_brand?.name ? ` (${i.chosen_brand.name})` : ""
      return `${i.quantity}x ${i.name || i.product?.name || "Item"}${brandStr}`
    }),
    "",
    `*Total:* R$ ${Number(order.total_value || 0).toFixed(2)}`,
    `*Pagamento:* ${order.payment_method || "A combinar"}`,
    `*Entrega:* ${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}`,
    "",
    "Obrigado por comprar conosco!",
  ].join("\n")

  return (
    <section className="space-y-6 p-6">
      <MarkOrderViewed orderId={id} />
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/pedidos">
            <Button size="sm" variant="outline"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#102016] font-mono">{order.protocol}</h1>
              <Badge className="text-xs">{order.status?.replace(/_/g, " ")}</Badge>
              <Badge variant="outline">{order.payment_status}</Badge>
            </div>
            <p className="text-sm text-[#526157]">Criado em {formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {whatsappPhone && (
              <a href={`https://wa.me/55${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Olá ${customer?.name}.\n\nRecebemos seu pedido!\n\nPedido:\n${order.basket?.name ? `${order.basket.name}\n` : ""}\nItens:\n${
                  items.map((i: any) => `- ${i.quantity}x ${i.name || i.product?.name || "Item"}${i.chosen_brand?.name ? ` (${i.chosen_brand.name})` : ""}`).join("\n")
                }\n\nValor:\n${formatCurrency(order.total_value || 0)}\n\nInforme:\n• endereço de entrega\nou\n• retirada\n\nQual será sua forma de pagamento?\nPix\nDinheiro\nCartão\n\nObrigado.`
              )}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="text-green-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </a>
            )}
            <div className="flex flex-wrap gap-1">
              {printerType === "thermal_58mm" ? (
                <Link href={`/imprimir/pedido/termica/${id}`} target="_blank">
                  <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </Link>
              ) : printerType === "thermal_80mm" ? (
                <Link href={`/imprimir/pedido/termica80/${id}`} target="_blank">
                  <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </Link>
              ) : (
                <Link href={`/imprimir/pedido/${id}`} target="_blank">
                  <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </Link>
              )}
              <div className="relative group">
                <Button variant="outline" className="px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#dfe7dd] bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="py-1">
                    <Link href={`/imprimir/pedido/${id}`} target="_blank" className="block px-4 py-2 text-sm text-[#102016] hover:bg-[#f0f5f0]">A4 (Padrão)</Link>
                    <Link href={`/imprimir/pedido/termica/${id}`} target="_blank" className="block px-4 py-2 text-sm text-[#102016] hover:bg-[#f0f5f0]">Térmica 58mm</Link>
                    <Link href={`/imprimir/pedido/termica80/${id}`} target="_blank" className="block px-4 py-2 text-sm text-[#102016] hover:bg-[#f0f5f0]">Térmica 80mm</Link>
                  </div>
                </div>
              </div>
            </div>
            <DeleteOrderButton orderId={id} />
          </div>
          <OrderCopyButtons order={order} items={items} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-[#526157]">Cliente</CardTitle></CardHeader>
          <CardContent>
            <div className="font-semibold text-[#102016]">{customer?.name || "-"}</div>
            <div className="text-sm text-[#526157]">{customer?.phone || "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-[#526157]">Entrega</CardTitle></CardHeader>
          <CardContent>
            <div className="font-semibold text-[#102016]">{order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}</div>
            {order.delivery_address && <div className="text-sm text-[#526157]">{order.delivery_address}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-[#526157]">Pagamento</CardTitle></CardHeader>
          <CardContent>
            <div className="font-semibold text-[#102016]">{order.payment_method || "A combinar"}</div>
            <div className="text-sm text-[#526157]">Status: {order.payment_status}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-[#526157]">Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-black text-[#102016]">{formatCurrency(order.total_value || 0)}</div>
            <div className="text-sm text-green-600">Lucro: {formatCurrency(order.total_profit || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white shadow-sm overflow-x-auto">
        <div className="px-4 py-3 bg-[#fcfdfa] border-b sticky left-0">
          <h2 className="text-sm font-bold text-[#102016]">Itens do Pedido</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Produto</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Marca</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Valor Un.</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Qtd</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {items.map((item: any) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-[#102016]">{item.name || item.product?.name || "Item"}</td>
                <td className="px-4 py-3 text-[#526157]">{item.chosen_brand?.name || item.product?.brand?.name || "-"}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#102016] mb-2">Observações</h3>
          <p className="text-sm text-[#526157]">{order.notes}</p>
        </div>
      )}

      {/* Status Timeline and Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OrderTimeline history={history} />
        <OrderActions order={order} />
      </div>

      {/* Internal Notes */}
      {notes && notes.length > 0 && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#102016]">Anotações Internas</h3>
          {notes.map((note: any) => (
            <div key={note.id} className="border-b border-[#f0f4f0] pb-2 text-sm">
              <p className="text-[#526157]">{note.note}</p>
              <p className="text-xs text-[#8c9c91]">{formatDateTime(note.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* NF-e */}
      {invoices && invoices.length > 0 && invoices.map((inv: any) => (
        <div key={inv.id} className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className={`h-5 w-5 ${inv.status === "AUTHORIZED" ? "text-green-600" : inv.status === "CANCELED" ? "text-red-500" : "text-amber-500"}`} />
            <div>
              <div className="font-medium text-[#102016]">{inv.emission_type} #{String(inv.number).padStart(6, "0")}</div>
              <div className="text-xs text-[#8c9c91]">
                Status: {inv.status === "AUTHORIZED" ? "Autorizada" : inv.status === "PENDENTE" ? "Pendente" : inv.status === "CANCELED" ? "Cancelada" : inv.status}
              </div>
            </div>
          </div>
          <Link href={`/imprimir/nfe/${inv.id}`} target="_blank">
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-2" /> Visualizar
            </Button>
          </Link>
        </div>
      ))}
      <OrderFinalizedModal orderId={id} printerType={printerType} shareMessage={shareMessage} open={finalizado === "true"} />
    </section>
  )
}
