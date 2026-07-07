import { getClient } from "@/lib/server-utils"

export interface DashboardMetrics {
  faturamento_dia: number
  faturamento_semana: number
  faturamento_mes: number
  faturamento_ano: number
  lucro_bruto: number
  lucro_liquido: number
  total_vendido: number
  total_comprado: number
  ticket_medio: number
  clientes_ativos: number
  clientes_inativos: number
  estoque_baixo: number
  pedidos_abertos: number
  pedidos_concluidos: number
  margem_lucro: number
  produtos_mais_vendidos: { name: string; quantity: number; category: string }[]
  categorias_mais_vendidas: { name: string; quantity: number }[]
  ultimas_movimentacoes: { id: string; product_name: string; movement_type: string; quantity: number; created_at: string }[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const sb = getClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()

  async function sumOrders(field: string, since: string): Promise<number> {
    const { data } = await sb
      .from("orders")
      .select(field)
      .gte("created_at", since)
      .not("status", "eq", "CANCELADO")
    return (data ?? []).reduce((s: number, o: any) => s + Number(o[field] || 0), 0)
  }

  async function countOrders(status: string): Promise<number> {
    const { count } = await sb
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", status)
    return count ?? 0
  }

  const [
    faturamento_dia,
    faturamento_semana,
    faturamento_mes,
    faturamento_ano,
    lucro_mes,
    total_spent,
    ticketData,
    clientesAtivos,
    clientesInativos,
    estoqueBaixo,
    pedidosAbertos,
    pedidosConcluidos,
  ] = await Promise.all([
    sumOrders("total_value", todayStart),
    sumOrders("total_value", weekStart.toISOString()),
    sumOrders("total_value", monthStart),
    sumOrders("total_value", yearStart),
    sumOrders("total_profit", monthStart),
    (async () => {
      const { data } = await sb.from("orders").select("total_value").not("status", "eq", "CANCELADO")
      return (data ?? []).reduce((s: number, o: any) => s + Number(o.total_value || 0), 0)
    })(),
    (async () => {
      const { data } = await sb.from("orders").select("total_value, total_profit").not("status", "eq", "CANCELADO")
      const total = (data ?? []).reduce((s: number, o: any) => s + Number(o.total_value || 0), 0)
      const count = (data ?? []).length
      return { total, count }
    })(),
    (async () => {
      const { count } = await sb.from("customers").select("*", { count: "exact", head: true }).eq("ativo", true)
      return count ?? 0
    })(),
    (async () => {
      const { count } = await sb.from("customers").select("*", { count: "exact", head: true }).eq("ativo", false)
      return count ?? 0
    })(),
    (async () => {
      const { data } = await sb.from("products").select("id, stock, min_stock").eq("ativo", true)
      return (data ?? []).filter((p) => p.stock <= (p.min_stock || 5)).length
    })(),
    (async () => {
      const { count } = await sb
        .from("orders")
        .select("*", { count: "exact", head: true })
        .not("status", "in", "('FINALIZADO','CANCELADO')")
      return count ?? 0
    })(),
    countOrders("FINALIZADO"),
  ])

  const total_vendido = total_spent
  const avgTicket = ticketData.count > 0 ? ticketData.total / ticketData.count : 0
  const margem = faturamento_mes > 0 ? (lucro_mes / faturamento_mes) * 100 : 0

  const totalOrdersVal = ticketData.total
  const totalProfitVal = (await sumOrders("total_profit", yearStart)) as number

  const topProducts = await getTopProducts(10)
  const topCategories = await getTopCategories()
  const latestMovements = await getLatestMovements()

  return {
    faturamento_dia,
    faturamento_semana,
    faturamento_mes,
    faturamento_ano,
    lucro_bruto: lucro_mes,
    lucro_liquido: faturamento_mes - (lucro_mes),
    total_vendido: totalOrdersVal,
    total_comprado: totalOrdersVal - totalProfitVal,
    ticket_medio: avgTicket,
    clientes_ativos: clientesAtivos,
    clientes_inativos: clientesInativos,
    estoque_baixo: estoqueBaixo,
    pedidos_abertos: pedidosAbertos,
    pedidos_concluidos: pedidosConcluidos,
    margem_lucro: margem,
    produtos_mais_vendidos: topProducts,
    categorias_mais_vendidas: topCategories,
    ultimas_movimentacoes: latestMovements,
  }
}

async function getTopProducts(limit: number = 10): Promise<{ name: string; quantity: number; category: string }[]> {
  const sb = getClient()
  const { data } = await sb
    .from("order_items")
    .select("quantity, product:products(name, categories:categories!products_category_id_fkey(name))")

  if (!data) return []

  const productSales: Record<string, { name: string; category: string; quantity: number }> = {}
  for (const item of data) {
    const prod = Array.isArray(item.product) ? item.product[0] : item.product
    if (!prod) continue
    const cat = prod.categories ? (Array.isArray(prod.categories) ? prod.categories[0] : prod.categories) : null
    if (!productSales[prod.name]) {
      productSales[prod.name] = { name: prod.name, category: cat?.name || "Sem categoria", quantity: 0 }
    }
    productSales[prod.name].quantity += item.quantity
  }

  return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, limit)
}

async function getTopCategories(): Promise<{ name: string; quantity: number }[]> {
  const sb = getClient()
  const { data } = await sb
    .from("order_items")
    .select("quantity, product:products(categories:categories!products_category_id_fkey(name))")

  if (!data) return []

  const catSales: Record<string, number> = {}
  for (const item of data) {
    const prod = Array.isArray(item.product) ? item.product[0] : item.product
    if (!prod) continue
    const cat = prod.categories ? (Array.isArray(prod.categories) ? prod.categories[0] : prod.categories) : null
    const catName = cat?.name || "Sem categoria"
    catSales[catName] = (catSales[catName] || 0) + item.quantity
  }

  return Object.entries(catSales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
}

async function getLatestMovements(limit: number = 10) {
  const sb = getClient()
  const { data } = await sb
    .from("stock_movements")
    .select("id, product_id, movement_type, quantity, reason, created_at, product:products!stock_movements_product_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []).map((m: any) => {
    const prod = Array.isArray(m.product) ? m.product[0] : m.product
    return {
      id: m.id,
      product_name: prod?.name || "Produto removido",
      movement_type: m.movement_type,
      quantity: m.quantity,
      created_at: m.created_at,
    }
  })
}

export interface FullDashboard {
  revenue: number
  profit: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  totalStock: number
  ordersByStatus: { status: string; count: number }[]
  monthlySales: { month: string; revenue: number; orders: number }[]
  dailySales: { day: string; revenue: number; orders: number }[]
  topProducts: { name: string; quantity: number; category: string }[]
  pendingOrders: number
  recentOrders: {
    id: string
    protocol: string
    customer_name: string
    total_value: number
    status: string
    created_at: string
  }[]
}

export async function getFullDashboard(): Promise<FullDashboard> {
  const sb = getClient()
  const now = new Date()

  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    { data: finalizedOrders },
    { count: totalOrders },
    { count: totalCustomers },
    { count: totalProducts },
    { data: productStock },
    { data: basketStock },
    { data: statusCounts },
    { data: recentOrdersData },
    { data: lastYearOrders },
    { data: lastWeekOrders },
    topProductsData,
  ] = await Promise.all([
    sb.from("orders").select("total_value, total_profit").eq("status", "FINALIZADO"),
    sb.from("orders").select("*", { count: "exact", head: true }),
    sb.from("customers").select("*", { count: "exact", head: true }).eq("ativo", true),
    sb.from("products").select("*", { count: "exact", head: true }).eq("ativo", true),
    sb.from("products").select("stock").eq("ativo", true),
    sb.from("basket_items").select("quantity"),
    sb.from("orders").select("status"),
    sb.from("orders")
      .select("id, protocol, total_value, status, created_at, customer:customers!orders_customer_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    sb.from("orders")
      .select("total_value, created_at")
      .gte("created_at", twelveMonthsAgo)
      .not("status", "eq", "CANCELADO"),
    sb.from("orders")
      .select("total_value, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .not("status", "eq", "CANCELADO"),
    getTopProducts(10),
  ])

  const revenue = (finalizedOrders ?? []).reduce((s: number, o: any) => s + Number(o.total_value || 0), 0)
  const profit = (finalizedOrders ?? []).reduce((s: number, o: any) => s + Number(o.total_profit || 0), 0)

  const prodStock = (productStock ?? []).reduce((s: number, p: any) => s + Number(p.stock || 0), 0)
  const baskStock = (basketStock ?? []).reduce((s: number, b: any) => s + Number(b.quantity || 0), 0)
  const totalStock = prodStock + baskStock

  const statusMap: Record<string, number> = {}
  for (const order of statusCounts ?? []) {
    statusMap[order.status] = (statusMap[order.status] || 0) + 1
  }
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  const pendingOrders = (statusCounts ?? []).filter(
    (o: any) => o.status !== "FINALIZADO" && o.status !== "CANCELADO"
  ).length

  const monthlyMap: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyMap[key] = { revenue: 0, orders: 0 }
  }
  for (const order of lastYearOrders ?? []) {
    const d = new Date(order.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += Number(order.total_value || 0)
      monthlyMap[key].orders += 1
    }
  }
  const monthlySales = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data }))

  const dailyMap: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().split("T")[0]
    dailyMap[key] = { revenue: 0, orders: 0 }
  }
  for (const order of lastWeekOrders ?? []) {
    const key = order.created_at?.split("T")[0]
    if (key && dailyMap[key]) {
      dailyMap[key].revenue += Number(order.total_value || 0)
      dailyMap[key].orders += 1
    }
  }
  const dailySales = Object.entries(dailyMap).map(([day, data]) => ({ day, ...data }))

  const recentOrders = (recentOrdersData ?? []).map((o: any) => {
    const customer = Array.isArray(o.customer) ? o.customer[0] : o.customer
    return {
      id: o.id,
      protocol: o.protocol || "",
      customer_name: customer?.name || "-",
      total_value: Number(o.total_value || 0),
      status: o.status,
      created_at: o.created_at,
    }
  })

  return {
    revenue,
    profit,
    totalOrders: totalOrders ?? 0,
    totalCustomers: totalCustomers ?? 0,
    totalProducts: totalProducts ?? 0,
    totalStock,
    ordersByStatus,
    monthlySales,
    dailySales,
    topProducts: topProductsData,
    pendingOrders,
    recentOrders,
  }
}
