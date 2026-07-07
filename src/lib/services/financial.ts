import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import { formatCurrency, type ListParams, type ListResult } from "./base"
import { optionalUuid } from "@/lib/zod-helpers"

export const financialEntrySchema = z.object({
  entry_type: z.enum(["RECEITA", "DESPESA", "CUSTO", "MARGEM", "LUCRO"]),
  amount: z.coerce.number().nonnegative(),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  payment_method: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  is_paid: z.boolean().default(true),
  notes: z.string().optional().or(z.literal("")),
  order_id: optionalUuid(),
  fornecedor: z.string().optional().or(z.literal("")),
  data_vencimento: z.string().optional().or(z.literal("")),
})

export type FinancialEntryInput = z.infer<typeof financialEntrySchema>

export interface FinancialFilters extends ListParams {
  entryType?: string
  isPaid?: string
  startDate?: string
  endDate?: string
}

export async function listFinancialEntries(filters: FinancialFilters = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 20, search = "", entryType, isPaid, startDate, endDate, sort = "created_at_desc" } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb.from("financial_entries").select("*", { count: "exact" })

  if (search) query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`)
  if (entryType) query = query.eq("entry_type", entryType)
  if (isPaid === "true") query = query.eq("is_paid", true)
  else if (isPaid === "false") query = query.eq("is_paid", false)
  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`)

  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function createFinancialEntry(payload: FinancialEntryInput) {
  const parsed = financialEntrySchema.parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("financial_entries").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/financeiro")
  return data
}

export async function updateFinancialEntry(id: string, payload: Partial<FinancialEntryInput>) {
  const parsed = financialEntrySchema.partial().parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("financial_entries").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/financeiro")
  return data
}

export async function deleteFinancialEntry(id: string) {
  const sb = getClient()
  const { error } = await sb.from("financial_entries").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/financeiro")
  return { success: true }
}

export async function getFinancialSummary(startDate?: string, endDate?: string) {
  const sb = getClient()

  let query = sb.from("financial_entries").select("*")
  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const entries = data ?? []
  const receitas = entries.filter((e) => e.entry_type === "RECEITA" && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const despesas = entries.filter((e) => (e.entry_type === "DESPESA" || e.entry_type === "CUSTO") && e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const saldo = receitas - despesas

  return { receitas, despesas, saldo, totalEntries: entries.length }
}

export async function getCashFlow(days: number = 30) {
  const sb = getClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await sb
    .from("financial_entries")
    .select("*")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  const dailyFlow: Record<string, { receitas: number; despesas: number; saldo: number }> = {}
  for (const entry of data ?? []) {
    const day = new Date(entry.created_at).toISOString().split("T")[0]
    if (!dailyFlow[day]) dailyFlow[day] = { receitas: 0, despesas: 0, saldo: 0 }
    if (entry.entry_type === "RECEITA" && entry.is_paid) {
      dailyFlow[day].receitas += Number(entry.amount)
    } else if ((entry.entry_type === "DESPESA" || entry.entry_type === "CUSTO") && entry.is_paid) {
      dailyFlow[day].despesas += Number(entry.amount)
    }
    dailyFlow[day].saldo = dailyFlow[day].receitas - dailyFlow[day].despesas
  }

  return Object.entries(dailyFlow).map(([date, data]) => ({ date, ...data }))
}
