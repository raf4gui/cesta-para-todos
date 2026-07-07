import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import { parseSortParam, type ListParams, type ListResult } from "./base"
import { optionalUuid } from "@/lib/zod-helpers"

export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  stock: z.coerce.number().int().nonnegative().default(0),
  price: z.coerce.number().nonnegative().default(0),
  purchase_price: z.coerce.number().nonnegative().default(0),
  sale_price: z.coerce.number().nonnegative().default(0),
  brand_id: optionalUuid(),
  category_id: optionalUuid(),
  ativo: z.boolean().default(true),
  disponivel: z.boolean().default(true),
  peso: z.string().optional().or(z.literal("")),
  volume: z.string().optional().or(z.literal("")),
  unidade: z.string().optional().or(z.literal("")),
  vendido_individualmente: z.boolean().default(true),
  faz_parte_de_cesta: z.boolean().default(false),
  faz_parte_de_fardo: z.boolean().default(false),
  internal_code: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  auto_profit: z.coerce.number().default(0),
  auto_margin: z.coerce.number().default(0),
  min_stock: z.coerce.number().int().nonnegative().default(5),
  supplier: z.string().optional().or(z.literal("")),
  oculto_catalogo: z.boolean().default(false),
  internal_cost: z.coerce.number().nonnegative().default(0),
  show_price: z.boolean().default(true), allow_personalization: z.boolean().default(false),
  featured: z.boolean().default(false),
})

export type ProductInput = z.infer<typeof productSchema>

export interface ProductFilters extends ListParams {
  brandId?: string
  categoryId?: string
  active?: string
  supplier?: string
  lowStock?: boolean
}

export async function listProducts(filters: ProductFilters = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 25, search = "", brandId, categoryId, active, sort = "created_at_desc", lowStock, supplier } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb
    .from("products")
    .select("*, brand:brands!products_brand_id_fkey(id, name), category:categories!products_category_id_fkey(id, name)", { count: "exact" })

  if (search) query = query.ilike("name", `%${search}%`)
  if (brandId) query = query.eq("brand_id", brandId)
  if (categoryId) query = query.eq("category_id", categoryId)
  if (active === "true") query = query.eq("ativo", true)
  else if (active === "false") query = query.eq("ativo", false)
  if (lowStock) query = query.lte("stock", 5)
  if (supplier) query = query.ilike("supplier", `%${supplier}%`)

  const sortConfig = parseSortParam(sort, "created_at_desc")
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending })
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getProduct(id: string) {
  const sb = getClient()
  const { data, error } = await sb
    .from("products")
    .select("*, brand:brands!products_brand_id_fkey(id, name), category:categories!products_category_id_fkey(id, name)")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(payload: ProductInput) {
  const parsed = productSchema.parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("products").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/produtos", "/admin/estoque")
  return data
}

export async function updateProduct(id: string, payload: Partial<ProductInput>) {
  const parsed = productSchema.partial().parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("products").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/produtos", `/admin/produtos/${id}`, "/admin/estoque")
  return data
}

export async function deleteProduct(id: string) {
  const sb = getClient()
  const { count } = await sb.from("basket_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id)
  if (count && count > 0) {
    throw new Error("Este produto faz parte de uma cesta. Remova-o da cesta antes.")
  }
  const { data, error } = await sb.from("products").update({ ativo: false }).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/produtos", "/admin/estoque")
  return data
}

export async function duplicateProduct(id: string) {
  const sb = getClient()
  const original = await getProduct(id)
  if (!original) throw new Error("Produto não encontrado")

  const { data, error } = await sb
    .from("products")
    .insert({
      name: `${original.name} (cópia)`,
      description: original.description,
      stock: 0,
      price: original.price,
      sale_price: original.sale_price,
      purchase_price: original.purchase_price,
      brand_id: original.brand_id,
      category_id: original.category_id,
      ativo: true,
      disponivel: original.disponivel,
      peso: original.peso,
      volume: original.volume,
      unidade: original.unidade,
      vendido_individualmente: original.vendido_individualmente,
      faz_parte_de_cesta: original.faz_parte_de_cesta,
      faz_parte_de_fardo: original.faz_parte_de_fardo,
      internal_code: original.internal_code,
      min_stock: original.min_stock,
      supplier: original.supplier,
      internal_cost: original.internal_cost,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/produtos")
  return data
}

export async function toggleProductStatus(id: string, field: "ativo" | "disponivel" | "oculto_catalogo", value: boolean) {
  const sb = getClient()
  const { data, error } = await sb.from("products").update({ [field]: value }).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/produtos", `/admin/produtos/${id}`, "/")
  return data
}

export async function adjustStock(id: string, quantity: number, reason: string) {
  const sb = getClient()
  const product = await getProduct(id)
  if (!product) throw new Error("Produto não encontrado")

  const newStock = product.stock + quantity
  if (newStock < 0) throw new Error("Estoque não pode ficar negativo")

  const { data, error } = await sb.from("products").update({ stock: newStock }).eq("id", id).select().single()
  if (error) throw new Error(error.message)

  await sb.from("stock_movements").insert({
    product_id: id,
    movement_type: quantity > 0 ? "ENTRADA" : "SAIDA",
    quantity: Math.abs(quantity),
    reason,
    previous_stock: product.stock,
    new_stock: newStock,
  })

  revalidateAdmin("/admin/produtos", "/admin/estoque")
  return data
}
