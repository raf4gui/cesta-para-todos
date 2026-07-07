import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import { parseSortParam, type ListParams, type ListResult } from "./base"
import { normalizePhone } from "@/lib/zod-helpers"

export const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  whatsapp: z.string().optional().or(z.literal("")),
  cpf_cnpj: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
})

export type CustomerInput = z.infer<typeof customerSchema>

export interface CustomerFilters extends ListParams {
  ativo?: string
}

export async function listCustomers(filters: CustomerFilters = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 20, search = "", sort = "created_at_desc", ativo } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb.from("customers").select("*", { count: "exact" })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,whatsapp.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`)
  }
  if (ativo === "true") query = query.eq("ativo", true)
  else if (ativo === "false") query = query.eq("ativo", false)

  const sortConfig = parseSortParam(sort, "created_at_desc")
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getCustomer(id: string) {
  const sb = getClient()
  const { data: customer, error } = await sb.from("customers").select("*").eq("id", id).single()
  if (error) throw new Error(error.message)

  const { data: orders } = await sb
    .from("orders")
    .select("*, basket:baskets!orders_basket_id_fkey(name)")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: totalSpent } = await sb
    .from("orders")
    .select("total_value")
    .eq("customer_id", id)
    .not("status", "eq", "CANCELADO")

  const total = (totalSpent ?? []).reduce((sum, o) => sum + Number(o.total_value || 0), 0)

  return {
    customer,
    orders: orders ?? [],
    totalSpent: total,
    orderCount: (orders ?? []).length,
  }
}

export async function createCustomer(payload: CustomerInput) {
  const parsed = customerSchema.parse(payload)
  const cleanedPhone = normalizePhone(parsed.phone || "")
  const sb = getClient()

  const { data: existing } = await sb.from("customers").select("id, name, phone").eq("phone", cleanedPhone).limit(1).maybeSingle()
  if (existing) {
    const updateFields: Record<string, any> = { name: parsed.name, phone: cleanedPhone }
    if (parsed.whatsapp) updateFields.whatsapp = parsed.whatsapp
    if (parsed.ativo !== undefined) updateFields.ativo = parsed.ativo
    const { data, error } = await sb.from("customers").update(updateFields).eq("id", existing.id).select().single()
    if (error) throw new Error(error.message)
    revalidateAdmin("/admin/clientes")
    return data
  }

  const cleaned = { ...parsed, phone: cleanedPhone }
  const { data, error } = await sb.from("customers").insert(cleaned).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/clientes")
  return data
}

export async function updateCustomer(id: string, payload: Partial<CustomerInput>) {
  const parsed = customerSchema.partial().parse(payload)
  const cleaned = parsed.phone ? { ...parsed, phone: normalizePhone(parsed.phone) } : parsed
  const sb = getClient()
  const { data, error } = await sb.from("customers").update(cleaned).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/clientes", `/admin/clientes/${id}`)
  return data
}

export async function deleteCustomer(id: string) {
  const sb = getClient()

  // Check for linked orders
  const { count: orderCount } = await sb.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", id)
  if (orderCount && orderCount > 0) {
    throw new Error(`Cliente possui ${orderCount} pedido(s) vinculado(s). Remova ou reatribua os pedidos antes de excluir.`)
  }

  const { error } = await sb.from("customers").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/clientes")
  return { success: true }
}
