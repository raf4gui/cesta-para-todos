"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function listOrders({ page = 1, limit = 10, search = "", status = "", paymentStatus = "" }: any = {}) {
  const from = (page - 1) * limit, to = from + limit - 1
  let q = sb().from("orders").select("*, customer:customers!orders_customer_id_fkey(name, phone), basket:baskets!orders_basket_id_fkey(name, tipo)", { count: "exact" })
  if (search) q = q.or(`protocol.ilike.%${search}%,customer.name.ilike.%${search}%`)
  if (status) q = q.eq("status", status)
  if (paymentStatus) q = q.eq("payment_status", paymentStatus)
  q = q.order("created_at", { ascending: false }).range(from, to)
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function listFormCustomers(search?: string) {
  let query = sb().from("customers").select("id, name, phone, address, city").eq("ativo", true).order("name")
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  const { data } = await query.limit(200)
  return data ?? []
}

export async function listFormProducts() {
  const { data } = await sb().from("products").select("id, name, sale_price, price, purchase_price").eq("ativo", true).order("name")
  return data ?? []
}

export async function listFormBaskets() {
  const { data } = await sb().from("baskets").select("id, name, price, tipo").eq("ativo", true).order("name")
  return data ?? []
}

export async function getOrder(id: string) {
  const { data: order, error: oe } = await sb().from("orders").select("*, customer:customers!orders_customer_id_fkey(*), basket:baskets!orders_basket_id_fkey(*)").eq("id", id).single()
  if (oe) throw new Error(oe.message)
  const { data: items } = await sb().from("order_items").select("*, product:products(name, price, sale_price, purchase_price, brand:brands!products_brand_id_fkey(name)), chosen_brand:brands!order_items_chosen_brand_id_fkey(name)").eq("order_id", id)
  const { data: history } = await sb().from("order_status_history").select("*").eq("order_id", id).order("changed_at", { ascending: true })
  const { data: notes } = await sb().from("order_notes").select("*").eq("order_id", id).order("created_at", { ascending: true })
  return { order, items: items ?? [], history: history ?? [], notes: notes ?? [] }
}

export async function createOrder(payload: any) {
  const { customer_id, basket_id, delivery_type, payment_method, notes, delivery_address, status, payment_status, items } = payload
  if (!items || items.length === 0) throw new Error("Adicione pelo menos um item")

  const { data: order, error } = await sb().from("orders").insert({
    customer_id, basket_id: basket_id || null, delivery_type: delivery_type || "RETIRADA",
    payment_method: payment_method || null, notes: notes || null, delivery_address: delivery_address || null,
    status: status || "AGUARDANDO_CONTATO", payment_status: payment_status || "PENDENTE",
    total_value: items.reduce((s: number, i: any) => s + i.total_price, 0),
    total_profit: items.reduce((s: number, i: any) => s + i.total_profit, 0),
  }).select().single()
  if (error) throw new Error(error.message)

  const { error: ie } = await sb().from("order_items").insert(items.map((i: any) => ({
    order_id: order.id, product_id: i.product_id, quantity: i.quantity,
    unit_price: i.unit_price, total_price: i.total_price, unit_cost: i.unit_cost || 0,
    total_profit: i.total_profit || 0, name: i.name || null, chosen_brand_id: i.chosen_brand_id || null,
  })))
  if (ie) throw new Error(ie.message)

  revalidatePath("/admin/pedidos")
  revalidatePath("/admin")
  revalidatePath("/admin/clientes")
  return order
}

export async function updateOrderStatus(id: string, status: string) {
  const extra: any = {}
  if (status === "FINALIZADO") extra.delivered_at = new Date().toISOString()
  if (status === "CANCELADO") extra.canceled_at = new Date().toISOString()
  const { data, error } = await sb().from("orders").update({ status, ...extra }).eq("id", id).select()
  if (error) throw new Error(error.message)
  const order = data?.[0]

  // Decrement stock on finalization
  if (status === "FINALIZADO" && order) {
    const { data: items } = await sb().from("order_items").select("product_id, quantity").eq("order_id", id)
    for (const item of items ?? []) {
      const { data: product } = await sb().from("products").select("stock").eq("id", item.product_id).single()
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity)
        await sb().from("products").update({ stock: newStock }).eq("id", item.product_id)
        await sb().from("stock_movements").insert({
          product_id: item.product_id,
          movement_type: "SAIDA",
          quantity: item.quantity,
          reason: `Pedido finalizado #${order.protocol}`,
          previous_stock: product.stock,
          new_stock: newStock,
          order_id: id,
        })
      }
    }
  }

  if (status === "FINALIZADO" && order) {
    const { data: existing } = await sb().from("financial_entries").select("id").eq("order_id", order.id).limit(1)
    if (!existing?.length) {
      const { error: fe } = await sb().from("financial_entries").insert({
        entry_type: "RECEITA", amount: Number(order.total_value || 0),
        category: "Vendas", description: `Finalização pedido ${order.protocol}`,
        payment_method: order.payment_method || null, is_paid: order.payment_status === "CONFIRMADO",
        order_id: order.id,
      })
      if (fe) throw new Error(fe.message)
    }
  }
  if (status === "CANCELADO" && order?.payment_status === "CONFIRMADO") {
    const { error: fe } = await sb().from("financial_entries").insert({
      entry_type: "DESPESA", amount: Number(order.total_value || 0),
      category: "Cancelamentos", description: `Estorno pedido ${order.protocol}`,
      is_paid: true, order_id: order.id,
    })
    if (fe && !fe.message?.includes("duplicate")) throw new Error(fe.message)
  }

  // Auto-generate NF when finalized and payment is confirmed
  if (status === "FINALIZADO" && order?.payment_status === "CONFIRMADO") {
    await autoGenerateNfe(id)
  }

  revalidatePath("/admin/pedidos")
  revalidatePath("/admin/nfe")
  revalidatePath("/admin")
  return order
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const { data, error } = await sb().from("orders").update({
    payment_status: paymentStatus, payment_confirmed_at: paymentStatus === "CONFIRMADO" ? new Date().toISOString() : null,
  }).eq("id", id).select()
  if (error) throw new Error(error.message)
  const order = data?.[0]
  if (paymentStatus === "CONFIRMADO" && order) {
    const { error: fe } = await sb().from("financial_entries").insert({
      entry_type: "RECEITA", amount: Number(order.total_value || 0),
      category: "Vendas", description: `Recebimento pedido ${order.protocol}`,
      payment_method: order.payment_method || null, is_paid: true, order_id: order.id,
    })
    if (fe && !fe.message?.includes("duplicate")) throw new Error(fe.message)

    // Auto-generate NF when payment confirmed and order is finalized
    if (order.status === "FINALIZADO") {
      await autoGenerateNfe(id)
    }
  }
  revalidatePath("/admin/pedidos")
  revalidatePath("/admin/nfe")
  revalidatePath("/admin")
  return order
}

export async function deleteOrder(id: string) {
  const { error } = await sb().rpc("delete_order_cascade", { p_order_id: id })
  if (error) throw new Error(error.message)
  revalidatePath("/admin/pedidos")
  revalidatePath("/admin")
  return { success: true }
}

export async function duplicateOrder(id: string) {
  const { order, items } = await getOrder(id)
  const { data: customer } = await sb().from("customers").select("id").eq("id", order.customer_id).single()
  if (!customer) throw new Error("Cliente não encontrado")

  const { data: newOrder, error: oe } = await sb().from("orders").insert({
    customer_id: customer.id,
    basket_id: order.basket_id || null,
    delivery_type: order.delivery_type || "RETIRADA",
    payment_method: order.payment_method || null,
    notes: order.notes || null,
    delivery_address: order.delivery_address || null,
    status: "AGUARDANDO_CONTATO",
    payment_status: "PENDENTE",
    origin: order.origin || "MANUAL",
  }).select().single()
  if (oe) throw new Error(oe.message)

  if (items?.length) {
    const { error: ie } = await sb().from("order_items").insert(
      items.map((i: any) => ({
        order_id: newOrder.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        unit_cost: i.unit_cost || 0,
        total_profit: i.total_profit || 0,
        name: i.name || null,
        chosen_brand_id: i.chosen_brand_id || null,
      }))
    )
    if (ie) throw new Error(ie.message)
  }

  revalidatePath("/admin/pedidos")
  revalidatePath("/admin")
  return newOrder
}

export async function reopenOrder(id: string) {
  const order = await sb().from("orders").select("*").eq("id", id).single()
  if (!order.data) throw new Error("Pedido não encontrado")
  if (order.data.status !== "CANCELADO") throw new Error("Apenas pedidos cancelados podem ser reabertos")

  const { data: updated, error } = await sb().from("orders").update({
    status: "AGUARDANDO_CONTATO",
    canceled_at: null,
  }).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/pedidos")
  revalidatePath("/admin")
  return updated
}

async function autoGenerateNfe(orderId: string) {
  try {
    const sbLocal = sb()

    // Check store settings for auto-emit flag
    const { data: settings } = await sbLocal.from("store_settings").select("emitir_nota_automaticamente").eq("id", true).single()
    if (settings && settings.emitir_nota_automaticamente === false) return

    // Check if NF already exists for this order
    const { count } = await sbLocal.from("nfe_emissions").select("*", { count: "exact", head: true }).eq("order_id", orderId)
    if (count && count > 0) return

    let { data: config } = await sbLocal.from("nfe_config").select("*").eq("id", true).single()

    // Create nfe_config with defaults if it doesn't exist
    if (!config) {
      const { data: newConfig, error: createError } = await sbLocal.from("nfe_config").insert({
        id: true,
        serie_nfe: 1,
        serie_nfce: 1,
        ultimo_numero_nfe: 1,
        ultimo_numero_nfce: 1,
        provider: "NUVEMFISCAL",
        environment: "homologacao",
      }).select().single()
      if (createError) throw createError
      config = newConfig
    }

    const nextNumber = (config.ultimo_numero_nfce || 0) + 1

    await sbLocal.from("nfe_emissions").insert({
      order_id: orderId,
      emission_type: "NFCE",
      status: "PENDENTE",
      number: nextNumber,
      serie: config.serie_nfce || 1,
    })

    await sbLocal.from("nfe_config").update({
      ultimo_numero_nfce: nextNumber,
      updated_at: new Date().toISOString(),
    }).eq("id", true)

    await sbLocal.from("orders").update({
      nfce_number: String(nextNumber),
    }).eq("id", orderId)
  } catch (err) {
    console.error("autoGenerateNfe error:", err)
  }
}

export async function emitNfeForOrder(orderId: string) {
  const sbLocal = sb()
  const { data: order } = await sbLocal.from("orders").select("status, payment_status").eq("id", orderId).single()
  if (!order) throw new Error("Pedido não encontrado")
  if (order.status !== "FINALIZADO") throw new Error("Apenas pedidos finalizados podem gerar NF")
  if (order.payment_status !== "CONFIRMADO") throw new Error("Pagamento precisa estar confirmado")

  await autoGenerateNfe(orderId)
  revalidatePath("/admin/nfe")
  revalidatePath("/admin/pedidos")
  revalidatePath("/admin")
  return { success: true }
}

export async function markOrderAsViewed(id: string) {
  const { error } = await sb().from("orders").update({ viewed_at: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getUnreadOrdersCount() {
  const { count, error } = await sb().from("orders").select("*", { count: "exact", head: true }).is("viewed_at", null)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function addOrderNote(id: string, note: string) {
  const { data, error } = await sb().from("order_notes").insert({ order_id: id, note }).select().single()
  if (error) throw new Error(error.message)
  return data
}


