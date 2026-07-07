import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import type { ListParams, ListResult } from "./base"
import { adjustStock } from "./products"
import { optionalUuid } from "@/lib/zod-helpers"

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().nonnegative().default(0),
  total_price: z.coerce.number().nonnegative().default(0),
  unit_cost: z.coerce.number().nonnegative().default(0),
  total_profit: z.coerce.number().nonnegative().default(0),
  name: z.string().optional(),
  chosen_brand_id: optionalUuid(),
})

export const orderSchema = z.object({
  customer_id: z.string().uuid(),
  basket_id: optionalUuid(),
  delivery_type: z.enum(["ENTREGA", "RETIRADA"]).default("RETIRADA"),
  payment_method: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  delivery_address: z.string().optional().or(z.literal("")),
  status: z.string().default("AGUARDANDO_CONTATO"),
  payment_status: z.string().default("PENDENTE"),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um item"),
})

export type OrderInput = z.infer<typeof orderSchema>

export async function listOrders(params: ListParams & { status?: string; paymentStatus?: string } = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 10, search = "", status = "", paymentStatus = "" } = params
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb
    .from("orders")
    .select("*, customer:customers!orders_customer_id_fkey(name, phone), basket:baskets!orders_basket_id_fkey(name, tipo)", { count: "exact" })

  if (search) {
    query = query.or(`protocol.ilike.%${search}%,customer.name.ilike.%${search}%`)
  }
  if (status) query = query.eq("status", status)
  if (paymentStatus) query = query.eq("payment_status", paymentStatus)

  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getOrder(id: string) {
  const sb = getClient()

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("*, customer:customers!orders_customer_id_fkey(*), basket:baskets!orders_basket_id_fkey(*)")
    .eq("id", id)
    .single()
  if (orderErr) throw new Error(orderErr.message)

  const { data: items, error: itemsErr } = await sb
    .from("order_items")
    .select("*, product:products(name, price, sale_price, purchase_price, brand:brands!products_brand_id_fkey(name)), chosen_brand:brands!order_items_chosen_brand_id_fkey(name)")
    .eq("order_id", id)
  if (itemsErr) throw new Error(itemsErr.message)

  const { data: history, error: histErr } = await sb
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("changed_at", { ascending: true })
  if (histErr) throw new Error(histErr.message)

  const { data: notes } = await sb
    .from("order_notes")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true })

  return { order, items: items ?? [], history: history ?? [], notes: notes ?? [] }
}

export async function createOrder(payload: OrderInput) {
  const parsed = orderSchema.parse(payload)
  const sb = getClient()

  const { data: order, error } = await sb
    .from("orders")
    .insert({
      customer_id: parsed.customer_id,
      basket_id: parsed.basket_id || null,
      delivery_type: parsed.delivery_type,
      payment_method: parsed.payment_method || null,
      notes: parsed.notes || null,
      delivery_address: parsed.delivery_address || null,
      status: parsed.status,
      payment_status: parsed.payment_status,
      total_value: parsed.items.reduce((sum, i) => sum + i.total_price, 0),
      total_profit: parsed.items.reduce((sum, i) => sum + i.total_profit, 0),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  const itemsToInsert = parsed.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    unit_cost: item.unit_cost,
    total_profit: item.total_profit,
    name: item.name || null,
    chosen_brand_id: item.chosen_brand_id || null,
  }))

  const { error: itemsErr } = await sb.from("order_items").insert(itemsToInsert)
  if (itemsErr) throw new Error(itemsErr.message)

  revalidateAdmin("/admin/pedidos", "/admin", "/admin/clientes")
  return order
}

export async function updateOrderStatus(id: string, status: string) {
  const sb = getClient()
  const extra: Record<string, any> = {}
  if (status === "FINALIZADO") extra.delivered_at = new Date().toISOString()
  if (status === "CANCELADO") extra.canceled_at = new Date().toISOString()

  const { data, error } = await sb.from("orders").update({ status, ...extra }).eq("id", id).select().single()
  if (error) throw new Error(error.message)

  // Decrement stock on finalization
  if (status === "FINALIZADO") {
    const { data: items } = await sb.from("order_items").select("product_id, quantity").eq("order_id", id)
    for (const item of items ?? []) {
      const { data: product } = await sb.from("products").select("stock").eq("id", item.product_id).single()
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity)
        await sb.from("products").update({ stock: newStock }).eq("id", item.product_id)
        await sb.from("stock_movements").insert({
          product_id: item.product_id,
          movement_type: "SAIDA",
          quantity: item.quantity,
          reason: `Pedido finalizado #${data.protocol}`,
          previous_stock: product.stock,
          new_stock: newStock,
          order_id: id,
        })
      }
    }
  }

  revalidateAdmin("/admin", "/admin/pedidos", `/admin/pedidos/${id}`)
  return data
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const sb = getClient()
  const { data, error } = await sb
    .from("orders")
    .update({
      payment_status: paymentStatus,
      payment_confirmed_at: paymentStatus === "CONFIRMADO" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)

  revalidateAdmin("/admin", "/admin/pedidos", `/admin/pedidos/${id}`)
  return data
}

export async function addOrderNote(id: string, note: string) {
  const sb = getClient()
  const { data, error } = await sb.from("order_notes").insert({ order_id: id, note }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function printOrder(id: string): Promise<string> {
  const { order, items } = await getOrder(id)
  const protocol = order.protocol
  const customer = order.customer
  const date = new Date(order.created_at).toLocaleDateString("pt-BR")

  const html = `
    <html><head><meta charset="UTF-8"><style>
      .print-order { font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 10px; }
      .print-order h1 { text-align: center; font-size: 16px; margin-bottom: 5px; }
      .print-order .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
      .print-order .info { margin-bottom: 10px; }
      .print-order .info div { margin-bottom: 3px; }
      .print-order table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      .print-order th, .print-order td { text-align: left; padding: 2px 4px; border-bottom: 1px solid #ccc; }
      .print-order th { font-weight: bold; }
      .print-order .total { text-align: right; font-weight: bold; margin-top: 5px; }
      .print-order .footer { text-align: center; margin-top: 15px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
      .print-order .status { text-align: center; margin: 10px 0; font-weight: bold; }
    </style></head><body>
    <div class="print-order">
    <div class="header">
      <h1>CESTA PARA TODOS</h1>
      <div>Protocolo: ${protocol}</div>
      <div>${date}</div>
    </div>
    <div class="info">
      <div><strong>Cliente:</strong> ${customer?.name || "-"}</div>
      <div><strong>Telefone:</strong> ${customer?.phone || "-"}</div>
      <div><strong>Entrega:</strong> ${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}</div>
      ${order.delivery_address ? `<div><strong>Endereço:</strong> ${order.delivery_address}</div>` : ""}
      ${order.payment_method ? `<div><strong>Pagamento:</strong> ${order.payment_method}</div>` : ""}
    </div>
    <table>
      <tr><th>Qtd</th><th>Produto</th><th>Valor</th></tr>
      ${items.map((i: any) => {
        const brandName = i.chosen_brand?.name || i.product?.brand?.name || ""
        const productName = i.name || i.product?.name || "-"
        const displayName = brandName ? `${productName} (${brandName})` : productName
        return `<tr><td>${i.quantity}x</td><td>${displayName}</td><td>R$ ${Number(i.total_price).toFixed(2)}</td></tr>`
      }).join("")}
    </table>
    <div class="total">Total: R$ ${Number(order.total_value || 0).toFixed(2)}</div>
    <div class="status">Status: ${order.status?.replace(/_/g, " ") || "Aguardando"}</div>
    ${order.notes ? `<div><strong>Obs:</strong> ${order.notes}</div>` : ""}
    <div class="footer">Obrigado por comprar conosco!</div>
    </div>
  </body></html>`

  return html
}

export function generateWhatsAppMessage(order: any, items: any[]): string {
  const customer = order.customer
  const itemList = items.map((i: any) => {
    const brandName = i.chosen_brand?.name || ""
    const productName = i.name || i.product?.name || "Item"
    return brandName ? `${i.quantity}x ${productName} (${brandName})` : `${i.quantity}x ${productName}`
  }).join("\n")
  const lines = [
    "*Pedido Confirmado!*",
    `Protocolo: ${order.protocol}`,
    `Cliente: ${customer?.name || "-"}`,
    `Telefone: ${customer?.phone || "-"}`,
    "",
    "*Itens:*",
    itemList,
    "",
    `*Total:* R$ ${Number(order.total_value || 0).toFixed(2)}`,
    `*Pagamento:* ${order.payment_method || "A combinar"}`,
    `*Entrega:* ${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}`,
    "",
    "Acompanhe seu pedido conosco!"
  ]
  return encodeURIComponent(lines.join("\n"))
}
