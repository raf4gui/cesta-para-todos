"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { optionalUuid } from "@/lib/zod-helpers"

const contaReceberSchema = z.object({
  descricao: z.string().optional().or(z.literal("")),
  valor: z.coerce.number().nonnegative(),
  data_vencimento: z.string(),
  status: z.enum(["pendente", "recebido", "cancelado"]).optional(),
  data_recebimento: z.string().optional().nullable().or(z.literal("")),
  pedido_id: optionalUuid(),
  cliente_id: optionalUuid(),
  observacao: z.string().optional().or(z.literal("")),
})

export type ContaReceberInput = z.infer<typeof contaReceberSchema>

export async function listContasReceber(filters: {
  status?: string
  search?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
} = {}) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { status, search, data_inicio, data_fim, page = 1, limit = 50 } = filters
  const from = (page - 1) * limit

  let q = sb
    .from("contas_receber")
    .select("*, cliente:customers!contas_receber_cliente_id_fkey(name), pedido:orders!contas_receber_pedido_id_fkey(protocol)", { count: "exact" })

  if (status && status !== "todos") q = q.eq("status", status)
  if (search) {
    q = q.or(`descricao.ilike.%${search}%,observacao.ilike.%${search}%`)
  }
  if (data_inicio) q = q.gte("data_vencimento", data_inicio)
  if (data_fim) q = q.lte("data_vencimento", data_fim)

  q = q.order("data_vencimento", { ascending: false }).range(from, from + limit - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getContaReceber(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb
    .from("contas_receber")
    .select("*, cliente:customers!contas_receber_cliente_id_fkey(name), pedido:orders!contas_receber_pedido_id_fkey(protocol)")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createContaReceber(data: ContaReceberInput) {
  const parsed = contaReceberSchema.parse(data)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: result, error } = await sb.from("contas_receber").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return result
}

export async function updateContaReceber(id: string, data: Partial<ContaReceberInput>) {
  const parsed = contaReceberSchema.partial().parse(data)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: result, error } = await sb.from("contas_receber").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return result
}

export async function marcarComoRecebido(id: string, data_recebimento: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb
    .from("contas_receber")
    .update({ status: "recebido", data_recebimento })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return data
}

export async function deleteContaReceber(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("contas_receber").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return { success: true }
}

export async function getResumoContasReceber() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("contas_receber").select("*")
  if (error) throw new Error(error.message)

  const entries = data ?? []
  const today = new Date().toISOString().split("T")[0]
  let totalAPagar = 0
  let totalRecebido = 0
  let totalVencido = 0

  for (const e of entries) {
    const val = Number(e.valor)
    if (e.status === "recebido") {
      totalRecebido += val
    } else if (e.status === "pendente") {
      totalAPagar += val
      if (e.data_vencimento < today) {
        totalVencido += val
      }
    }
  }

  return { totalAPagar, totalRecebido, totalVencido, total: entries.length }
}
