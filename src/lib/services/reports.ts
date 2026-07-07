import { getClient } from "@/lib/server-utils"

export interface ReportFilters {
  startDate?: string
  endDate?: string
  categoryId?: string
  productId?: string
  customerId?: string
  brandId?: string
  groupBy?: "day" | "week" | "month" | "year"
}

export async function getSalesReport(filters: ReportFilters = {}) {
  const sb = getClient()
  const { startDate, endDate, groupBy = "month" } = filters

  let query = sb
    .from("orders")
    .select("id, protocol, status, total_value, total_profit, created_at, customer_id, customer:customers!orders_customer_id_fkey(name)")

  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`)

  query = query.not("status", "eq", "CANCELADO").order("created_at", { ascending: false })

  const { data: orders, error } = await query
  if (error) throw new Error(error.message)

  const totalRevenue = (orders ?? []).reduce((s, o) => s + Number(o.total_value || 0), 0)
  const totalProfit = (orders ?? []).reduce((s, o) => s + Number(o.total_profit || 0), 0)
  const totalOrders = (orders ?? []).length
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const grouped: Record<string, { revenue: number; profit: number; orders: number }> = {}
  for (const order of orders ?? []) {
    const date = new Date(order.created_at)
    let key: string
    if (groupBy === "day") key = date.toISOString().split("T")[0]
    else if (groupBy === "week") {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split("T")[0]
    } else if (groupBy === "month") key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    else key = `${date.getFullYear()}`

    if (!grouped[key]) grouped[key] = { revenue: 0, profit: 0, orders: 0 }
    grouped[key].revenue += Number(order.total_value || 0)
    grouped[key].profit += Number(order.total_profit || 0)
    grouped[key].orders += 1
  }

  return {
    totalRevenue,
    totalProfit,
    totalOrders,
    avgTicket,
    margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    grouped,
    orders: orders ?? [],
  }
}

export async function getProductReport(filters: ReportFilters = {}) {
  const sb = getClient()
  const { startDate, endDate } = filters

  let query = sb
    .from("order_items")
    .select("product_id, quantity, total_price, total_profit, product:products(name, category_id, categories:categories!products_category_id_fkey(name)), order:orders!inner(created_at, status)")

  if (startDate) query = query.gte("order.created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte("order.created_at", `${endDate}T23:59:59.999Z`)

  query = query.not("order.status", "eq", "CANCELADO")

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const productSummary: Record<string, { name: string; category: string; quantity: number; revenue: number; profit: number }> = {}
  for (const item of data ?? []) {
    const prod = Array.isArray(item.product) ? item.product[0] : item.product
    if (!prod) continue
    const cat = prod.categories ? (Array.isArray(prod.categories) ? prod.categories[0] : prod.categories) : null
    if (!productSummary[prod.name]) {
      productSummary[prod.name] = { name: prod.name, category: cat?.name || "Sem categoria", quantity: 0, revenue: 0, profit: 0 }
    }
    productSummary[prod.name].quantity += item.quantity
    productSummary[prod.name].revenue += Number(item.total_price || 0)
    productSummary[prod.name].profit += Number(item.total_profit || 0)
  }

  return Object.values(productSummary).sort((a, b) => b.quantity - a.quantity)
}

export async function getCustomerReport(filters: ReportFilters = {}) {
  const sb = getClient()
  const { startDate, endDate } = filters

  let query = sb.from("customers").select("id, name, phone, purchase_count, total_spent, last_purchase_date, created_at, ativo")

  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`)

  query = query.order("total_spent", { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data ?? []
}

export function exportToCSV(data: Record<string, any>[], filename: string): string {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(";"),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h]
        if (val === null || val === undefined) return ""
        const str = String(val).replace(/"/g, '""')
        return str.includes(";") || str.includes('"') || str.includes("\n") ? `"${str}"` : str
      }).join(";")
    ),
  ]

  const BOM = "\uFEFF"
  return BOM + csvRows.join("\n")
}

export function formatReportValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}
