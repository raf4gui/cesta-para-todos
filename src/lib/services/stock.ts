import { getClient, revalidateAdmin } from "@/lib/server-utils"
import type { ListParams, ListResult } from "./base"

export interface StockMovementFilters extends ListParams {
  productId?: string
  movementType?: string
  startDate?: string
  endDate?: string
}

export async function listStockMovements(filters: StockMovementFilters = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 20, productId, movementType, startDate, endDate } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb
    .from("stock_movements")
    .select("*, product:products!stock_movements_product_id_fkey(name)", { count: "exact" })

  if (productId) query = query.eq("product_id", productId)
  if (movementType) query = query.eq("movement_type", movementType)
  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`)

  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getStockSummary() {
  const sb = getClient()
  const { data: products, error } = await sb
    .from("products")
    .select("id, name, stock, min_stock, price, sale_price, category_id, categories:categories!products_category_id_fkey(name), ativo, supplier")
    .eq("ativo", true)
    .order("stock", { ascending: true })

  if (error) throw new Error(error.message)

  const esgotados = (products ?? []).filter((p) => p.stock === 0)
  const baixo = (products ?? []).filter((p) => p.stock > 0 && p.stock <= (p.min_stock || 5))
  const normal = (products ?? []).filter((p) => p.stock > (p.min_stock || 5))

  return {
    all: products ?? [],
    esgotados,
    baixo,
    normal,
    totalValue: (products ?? []).reduce((s, p) => s + Number(p.sale_price || p.price || 0) * p.stock, 0),
  }
}

export async function registerManualMovement(
  productId: string,
  type: "ENTRADA" | "SAIDA" | "AJUSTE",
  quantity: number,
  reason: string,
  userId?: string
) {
  const sb = getClient()

  const { data: product, error: prodErr } = await sb
    .from("products")
    .select("id, stock, price, purchase_price")
    .eq("id", productId)
    .single()

  if (prodErr) throw new Error("Produto não encontrado")

  const previousStock = product.stock
  let newStock: number

  if (type === "ENTRADA") newStock = previousStock + quantity
  else if (type === "SAIDA") newStock = previousStock - quantity
  else newStock = quantity

  if (newStock < 0) throw new Error("Estoque não pode ficar negativo")

  const { error: updateErr } = await sb.from("products").update({ stock: newStock }).eq("id", productId)
  if (updateErr) throw new Error(updateErr.message)

  const { error: moveErr } = await sb.from("stock_movements").insert({
    product_id: productId,
    movement_type: type,
    quantity: Math.abs(quantity),
    reason,
    previous_stock: previousStock,
    new_stock: newStock,
  })
  if (moveErr) throw new Error(moveErr.message)

  revalidateAdmin("/admin/estoque", "/admin/produtos")
  return { success: true, previousStock, newStock }
}
