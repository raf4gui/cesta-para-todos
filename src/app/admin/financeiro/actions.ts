"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { optionalUuid } from "@/lib/zod-helpers"

const entrySchema = z.object({
  entry_type: z.enum(["RECEITA", "DESPESA", "CUSTO"]),
  amount: z.coerce.number().positive(),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  payment_method: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  is_paid: z.boolean().default(true),
  notes: z.string().optional().or(z.literal("")),
  order_id: optionalUuid(),
  fornecedor: z.string().optional().or(z.literal("")),
  data_vencimento: z.string().optional().or(z.literal("")),
  recurring: z.boolean().default(false),
  recurring_interval: z.string().optional().or(z.literal("")),
})

export async function createFinancialEntry(payload: any) {
  const parsed = entrySchema.parse(payload)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("financial_entries").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return data
}

export async function listFinancialEntries(filters: any = {}) {
  const { page = 1, limit = 20, entryType, isPaid, startDate, endDate, category, paymentMethod, search } = filters
  const from = (page - 1) * limit
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let q = sb.from("financial_entries").select("*", { count: "exact" })
  if (entryType) q = q.eq("entry_type", entryType)
  if (isPaid === "true") q = q.eq("is_paid", true)
  else if (isPaid === "false") q = q.eq("is_paid", false)
  else if (isPaid === "overdue") {
    const today = new Date().toISOString().split("T")[0]
    q = q.eq("is_paid", false).lt("due_date", today)
  }
  if (startDate) q = q.gte("created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) q = q.lte("created_at", `${endDate}T23:59:59.999Z`)
  if (category) q = q.eq("category", category)
  if (paymentMethod) q = q.eq("payment_method", paymentMethod)
  if (search) q = q.or(`description.ilike.%${search}%,notes.ilike.%${search}%,fornecedor.ilike.%${search}%`)
  q = q.order("created_at", { ascending: false }).range(from, from + limit - 1)
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function updateFinancialEntry(id: string, payload: any) {
  const parsed = entrySchema.partial().parse(payload)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("financial_entries").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return data
}

export async function deleteFinancialEntry(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("financial_entries").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return { success: true }
}

const recurringSchema = z.object({
  nome: z.string().optional().or(z.literal("")),
  categoria: z.string().optional().or(z.literal("")),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  data_vencimento: z.coerce.number().int().min(1, "Dia inválido").max(31, "Dia inválido"),
  frequencia: z.enum(["diaria", "semanal", "quinzenal", "mensal", "bimestral", "trimestral", "semestral", "anual"]),
  status: z.enum(["ativa", "pausada", "cancelada"]).default("ativa"),
  forma_pagamento: z.string().optional().or(z.literal("")),
  observacao: z.string().optional().or(z.literal("")),
})

export type RecurringExpenseInput = z.infer<typeof recurringSchema>

export async function listRecurringExpenses() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("recurring_expenses").select("*").order("data_vencimento", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createRecurringExpense(payload: RecurringExpenseInput) {
  const parsed = recurringSchema.parse(payload)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const today = new Date()
  const nextGen = new Date(today.getFullYear(), today.getMonth(), parsed.data_vencimento)
  if (nextGen <= today) nextGen.setMonth(nextGen.getMonth() + 1)
  const { data, error } = await sb.from("recurring_expenses").insert({
    ...parsed,
    proxima_geracao: nextGen.toISOString().split("T")[0],
  }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return data
}

export async function updateRecurringExpense(id: string, payload: Partial<RecurringExpenseInput>) {
  const parsed = recurringSchema.partial().parse(payload)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("recurring_expenses").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return data
}

export async function deleteRecurringExpense(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("recurring_expenses").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return { success: true }
}

export async function getCalendarEvents(month: number, year: number) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const events: Record<number, Array<{ id: string; title: string; type: "recebimento" | "vencimento" | "recorrente"; value: number }>> = {}

  const { data: entries } = await sb.from("financial_entries")
    .select("id, description, amount, due_date, entry_type")
    .gte("due_date", `${monthStr}-01`)
    .lte("due_date", `${monthStr}-${daysInMonth}`)

  for (const e of entries ?? []) {
    if (!e.due_date) continue
    const day = new Date(e.due_date).getDate()
    if (!events[day]) events[day] = []
    events[day].push({
      id: e.id,
      title: e.description || `${e.entry_type === "RECEITA" ? "Receita" : "Despesa"}`,
      type: e.entry_type === "RECEITA" ? "recebimento" : "vencimento",
      value: Number(e.amount),
    })
  }

  const { data: contas } = await sb.from("contas_receber")
    .select("id, descricao, valor, data_vencimento")
    .gte("data_vencimento", `${monthStr}-01`)
    .lte("data_vencimento", `${monthStr}-${daysInMonth}`)

  for (const c of contas ?? []) {
    const day = new Date(c.data_vencimento).getDate()
    if (!events[day]) events[day] = []
    events[day].push({
      id: `cr-${c.id}`,
      title: c.descricao || "Conta a Receber",
      type: "recebimento",
      value: Number(c.valor),
    })
  }

  const { data: recs } = await sb.from("recurring_expenses").select("id, nome, valor, data_vencimento, status").eq("status", "ativa")

  for (const r of recs ?? []) {
    if (!events[r.data_vencimento]) events[r.data_vencimento] = []
    events[r.data_vencimento].push({
      id: `re-${r.id}`,
      title: r.nome || "Recorrente",
      type: "recorrente",
      value: Number(r.valor),
    })
  }

  return events
}

export async function getAlerts() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const today = new Date().toISOString().split("T")[0]
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]

  const { data: entries } = await sb.from("financial_entries").select("*")
  const { data: contas } = await sb.from("contas_receber").select("*").eq("status", "pendente")

  const all: Array<{ id: string; type: "vencida" | "vence-hoje" | "vence-3dias" | "recorrente-gerada"; message: string; count: number }> = []

  const vencidas = (entries ?? []).filter((e: any) => !e.is_paid && e.due_date && e.due_date < today)
  if (vencidas.length > 0) {
    all.push({ id: "vencidas", type: "vencida", message: `${vencidas.length} conta(s) vencida(s)`, count: vencidas.length })
  }

  const venceHoje = (entries ?? []).filter((e: any) => !e.is_paid && e.due_date === today)
  if (venceHoje.length > 0) {
    all.push({ id: "vence-hoje", type: "vence-hoje", message: `${venceHoje.length} conta(s) vence(m) hoje`, count: venceHoje.length })
  }

  const vence3dias: any[] = []
  for (const e of entries ?? []) {
    if (!e.is_paid && e.due_date && e.due_date > today && e.due_date <= in3Days) {
      vence3dias.push(e)
    }
  }
  if (vence3dias.length > 0) {
    all.push({ id: "vence-3dias", type: "vence-3dias", message: `${vence3dias.length} conta(s) vence(m) em 3 dias`, count: vence3dias.length })
  }

  const contasVencidas = (contas ?? []).filter((c: any) => c.data_vencimento < today)
  if (contasVencidas.length > 0) {
    all.push({ id: "contas-vencidas", type: "vencida", message: `${contasVencidas.length} conta(s) a receber vencida(s)`, count: contasVencidas.length })
  }

  return all
}

export async function markAlertAsRead(alertId: string) {
  return { success: true }
}
