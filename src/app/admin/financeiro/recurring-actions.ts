"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const recurringExpenseSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().optional().or(z.literal("")),
  valor: z.coerce.number().nonnegative("Valor deve ser maior ou igual a zero"),
  data_vencimento: z.coerce.number().int().min(1).max(31).default(1),
  observacao: z.string().optional().or(z.literal("")),
  forma_pagamento: z.string().optional().or(z.literal("")),
  status: z.enum(["ativa", "pausada", "cancelada"]).optional().default("ativa"),
  frequencia: z.enum(["diaria", "semanal", "quinzenal", "mensal", "bimestral", "trimestral", "semestral", "anual"]).optional().default("mensal"),
})

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>

export async function listRecurringExpenses(filters: {
  status?: string
  search?: string
  page?: number
  limit?: number
} = {}) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { status, search, page = 1, limit = 50 } = filters
  const from = (page - 1) * limit

  let q = sb.from("recurring_expenses").select("*", { count: "exact" })

  if (status && status !== "todas") q = q.eq("status", status)
  if (search) {
    q = q.or(`nome.ilike.%${search}%,categoria.ilike.%${search}%,observacao.ilike.%${search}%`)
  }

  q = q.order("created_at", { ascending: false }).range(from, from + limit - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getRecurringExpense(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("recurring_expenses").select("*").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createRecurringExpense(data: RecurringExpenseInput) {
  const parsed = recurringExpenseSchema.parse(data)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: result, error } = await sb.from("recurring_expenses").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return result
}

export async function updateRecurringExpense(id: string, data: Partial<RecurringExpenseInput>) {
  const parsed = recurringExpenseSchema.partial().parse(data)
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: result, error } = await sb.from("recurring_expenses").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return result
}

export async function deleteRecurringExpense(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("recurring_expenses").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return { success: true }
}

export async function toggleRecurringStatus(id: string, status: "ativa" | "pausada" | "cancelada") {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb
    .from("recurring_expenses")
    .update({ status })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return data
}

export async function gerarDespesasRecorrentes() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.rpc("gerar_despesas_recorrentes")
  if (error) throw new Error(error.message)
  revalidatePath("/admin/financeiro")
  return { success: true }
}

export async function getFinancialAlerts() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("financial_alerts").select("*").order("created_at", { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUnreadAlertsCount() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { count, error } = await sb.from("financial_alerts").select("*", { count: "exact", head: true }).eq("lida", false)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function markAlertAsRead(id: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("financial_alerts").update({ lida: true }).eq("id", id)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function markAllAlertsAsRead() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("financial_alerts").update({ lida: true }).neq("id", "00000000-0000-0000-0000-000000000000")
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getFinancialDashboard() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.rpc("get_financial_dashboard")
  if (error) throw new Error(error.message)
  return data as DashboardData
}

export type DashboardData = {
  receitasMes: number
  despesasMes: number
  lucroLiquido: number
  saldoDia: number
  saldoSemana: number
  saldoMes: number
  saldoAno: number
  saldoTotal: number
  entradasSaidas: { month: string; income: number; expense: number }[]
  gastosPorCategoria: { category: string; total: number }[]
  receitaMensal: { month: string; total: number }[]
  alertasCount: number
  contasVencidas: number
  contasVencendoHoje: number
  contasVencendo3Dias: number
  despesasRecorrentesAtivas: number
}

export async function getCalendarEvents(month: number, year: number) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`

  const [financialEntries, contasReceber, recurringExpenses] = await Promise.all([
    sb
      .from("financial_entries")
      .select("*")
      .or(`due_date.gte.${startDate},due_date.lte.${endDate},data_vencimento.gte.${startDate},data_vencimento.lte.${endDate}`)
      .order("due_date", { ascending: true }),
    sb
      .from("contas_receber")
      .select("*")
      .gte("data_vencimento", startDate)
      .lte("data_vencimento", endDate)
      .order("data_vencimento", { ascending: true }),
    sb
      .from("recurring_expenses")
      .select("*")
      .eq("status", "ativa")
      .order("data_vencimento", { ascending: true }),
  ])

  if (financialEntries.error) throw new Error(financialEntries.error.message)
  if (contasReceber.error) throw new Error(contasReceber.error.message)
  if (recurringExpenses.error) throw new Error(recurringExpenses.error.message)

  return {
    financial_entries: financialEntries.data ?? [],
    contas_receber: contasReceber.data ?? [],
    recurring_expenses: recurringExpenses.data ?? [],
  }
}
