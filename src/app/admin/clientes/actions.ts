"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { normalizePhone } from "@/lib/zod-helpers"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

const customerSchema = z.object({
  name: z.string().min(1), phone: z.string().min(1), whatsapp: z.string().optional().or(z.literal("")),
  cpf_cnpj: z.string().optional().or(z.literal("")), address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")), notes: z.string().optional().or(z.literal("")), ativo: z.boolean().default(true),
})

export async function listCustomers({
  page = 1, limit = 25, search = "", sort = "created_at_desc", ativo, filter,
}: { page?: number; limit?: number; search?: string; sort?: string; ativo?: string; filter?: string } = {}) {
  const from = (page - 1) * limit, to = from + limit - 1
  let q = sb().from("customers").select("*", { count: "exact" })

  // Search across name, phone, whatsapp, cpf_cnpj
  if (search) {
    const term = `%${search}%`
    q = q.or(`name.ilike.${term},phone.ilike.${term},whatsapp.ilike.${term},cpf_cnpj.ilike.${term},city.ilike.${term}`)
  }

  // Status filter
  if (ativo === "true") q = q.eq("ativo", true)
  else if (ativo === "false") q = q.eq("ativo", false)

  // Smart filters
  if (filter === "com_pedidos") q = q.gt("purchase_count", 0)
  else if (filter === "sem_pedidos") q = q.eq("purchase_count", 0)
  else if (filter === "recentes") q = q.gt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  else if (filter === "mais_compras") q = q.gt("purchase_count", 0).order("purchase_count", { ascending: false })
  else if (filter === "maior_faturamento") q = q.gt("total_spent", 0).order("total_spent", { ascending: false })

  // Sort
  const sortMap: Record<string, any> = {
    created_at_desc: { column: "created_at", ascending: false },
    created_at_asc: { column: "created_at", ascending: true },
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
    total_spent_desc: { column: "total_spent", ascending: false },
    purchase_count_desc: { column: "purchase_count", ascending: false },
    last_purchase_date_desc: { column: "last_purchase_date", ascending: false },
  }
  const sortConfig = sortMap[sort] || sortMap.created_at_desc
  q = q.order(sortConfig.column, { ascending: sortConfig.ascending })

  // Apply range (pagination)
  q = q.range(from, to)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)

  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function searchCustomersByOrder(orderNumber: string) {
  const { data, error } = await sb()
    .from("orders")
    .select("id, protocol, customer_id, customer:customers!orders_customer_id_fkey(id, name, phone)")
    .ilike("protocol", `%${orderNumber}%`)
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getCustomer(id: string) {
  const { data: customer, error: err1 } = await sb().from("customers").select("*").eq("id", id).single()
  if (err1) throw new Error(err1.message)

  const { data: orders, error: err2 } = await sb()
    .from("orders")
    .select("*, basket:baskets!orders_basket_id_fkey(name)")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(100) as any
  if (err2) throw new Error(err2.message)

  return { customer, orders: orders ?? [] }
}

export async function createCustomer(payload: any) {
  const parsed = customerSchema.parse(payload)
  const cleanedPhone = normalizePhone(parsed.phone || "")

  const { data: existing } = await sb().from("customers").select("id, name").eq("phone", cleanedPhone).limit(1).maybeSingle()
  if (existing) {
    const updateFields: Record<string, any> = { name: parsed.name, phone: cleanedPhone }
    if (parsed.whatsapp) updateFields.whatsapp = parsed.whatsapp
    if (parsed.ativo !== undefined) updateFields.ativo = parsed.ativo
    const { data, error } = await sb().from("customers").update(updateFields).eq("id", existing.id).select().single()
    if (error) throw new Error(error.message)
    revalidatePath("/admin/clientes")
    revalidatePath("/admin")
    return data
  }

  const cleaned = { ...parsed, phone: cleanedPhone }
  const { data, error } = await sb().from("customers").insert(cleaned).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/clientes")
  revalidatePath("/admin")
  return data
}

export async function updateCustomer(id: string, payload: any) {
  const parsed = customerSchema.partial().parse(payload)
  const cleaned = parsed.phone ? { ...parsed, phone: normalizePhone(parsed.phone) } : parsed
  const { data, error } = await sb().from("customers").update(cleaned).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/clientes")
  revalidatePath("/admin")
  return data
}

export async function deleteCustomer(id: string) {
  // Nullify orders' customer_id before deleting (requires migration 20260712000000)
  try {
    await sb().from("orders").update({ customer_id: null }).eq("customer_id", id)
  } catch {
    // Migration not yet applied — column may still be NOT NULL
  }

  const { error } = await sb().from("customers").delete().eq("id", id)
  if (error) {
    // Likely FK constraint — migration needed
    const { count: orderCount } = await sb().from("orders").select("*", { count: "exact", head: true }).eq("customer_id", id)
    const msg = orderCount && orderCount > 0
      ? `Cliente possui ${orderCount} pedido(s) vinculado(s). Aplique a migração mais recente ou desative o cliente em vez de excluí-lo.`
      : error.message
    throw new Error(msg)
  }
  revalidatePath("/admin/clientes")
  return { success: true }
}

export async function toggleCustomerStatus(id: string, ativo: boolean) {
  const { error } = await sb().from("customers").update({ ativo }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/clientes")
  return { success: true }
}
