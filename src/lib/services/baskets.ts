import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import { parseSortParam, type ListParams, type ListResult } from "./base"
import { optionalUuid } from "@/lib/zod-helpers"

export const basketSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().nonnegative().default(0),
  image_url: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
  tipo: z.enum(["CESTA_PRATICA", "CESTA_COMPLETA", "CESTAO_FAMILIA", "CESTA_PERSONALIZADA", "KIT", "FARDO"]).default("CESTA_PRATICA"),
  brand_id: optionalUuid(),
  quantidade_fardo: z.coerce.number().int().positive().optional().nullable(),
})

export type BasketInput = z.infer<typeof basketSchema>

export interface BasketFilters extends ListParams {
  tipo?: string
  active?: string
}

export async function listBaskets(filters: BasketFilters = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 10, search = "", sort = "created_at_desc", tipo, active } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb.from("baskets").select("*", { count: "exact" })
  if (search) query = query.ilike("name", `%${search}%`)
  if (tipo) query = query.eq("tipo", tipo)
  if (active === "true") query = query.eq("ativo", true)
  else if (active === "false") query = query.eq("ativo", false)

  const sortConfig = parseSortParam(sort, "created_at_desc")
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getBasket(id: string) {
  const sb = getClient()
  const { data: basket, error } = await sb.from("baskets").select("*").eq("id", id).single()
  if (error) throw new Error(error.message)

  const { data: items } = await sb
    .from("basket_items")
    .select("*, product:products(id, name, price, sale_price, image_url, brand_id, brand:brands!products_brand_id_fkey(id, name))")
    .eq("basket_id", id)

  const { data: allBrands } = await sb.from("brands").select("id, name").eq("ativo", true).order("name")

  const itemsWithBrands = await Promise.all(
    (items ?? []).map(async (item: any) => {
      const { data: brands } = await sb
        .from("basket_item_brands")
        .select("brand:brands!basket_item_brands_brand_id_fkey(id, name)")
        .eq("basket_id", id)
        .eq("product_id", item.product_id)
      return {
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
        allowed_brands: brands?.map((b: any) => (Array.isArray(b.brand) ? b.brand[0] : b.brand)) || [],
      }
    })
  )

  return { basket, items: itemsWithBrands, allBrands: allBrands ?? [] }
}

export async function createBasket(payload: BasketInput) {
  const parsed = basketSchema.parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("baskets").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/cestas")
  return data
}

export async function updateBasket(id: string, payload: Partial<BasketInput>) {
  const parsed = basketSchema.partial().parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("baskets").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/cestas", `/admin/cestas/${id}`, "/")
  return data
}

export async function deleteBasket(id: string) {
  const sb = getClient()
  const { error } = await sb.from("baskets").update({ ativo: false }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/cestas")
  return { success: true }
}

export async function addBasketItem(basketId: string, productId: string, quantity: number, isCustomizable: boolean = true) {
  const sb = getClient()
  const { data, error } = await sb
    .from("basket_items")
    .insert({ basket_id: basketId, product_id: productId, quantity, is_customizable: isCustomizable })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidateAdmin(`/admin/cestas/${basketId}`)
  return data
}

export async function removeBasketItem(basketId: string, productId: string) {
  const sb = getClient()
  const { error } = await sb.from("basket_items").delete().eq("basket_id", basketId).eq("product_id", productId)
  if (error) throw new Error(error.message)
  revalidateAdmin(`/admin/cestas/${basketId}`)
  return { success: true }
}

export async function setBasketItemBrands(basketId: string, productId: string, brandIds: string[]) {
  const sb = getClient()
  await sb.from("basket_item_brands").delete().eq("basket_id", basketId).eq("product_id", productId)
  if (brandIds.length > 0) {
    const { error } = await sb.from("basket_item_brands").insert(
      brandIds.map((brandId) => ({ basket_id: basketId, product_id: productId, brand_id: brandId }))
    )
    if (error) throw new Error(error.message)
  }
  revalidateAdmin(`/admin/cestas/${basketId}`)
  return { success: true }
}
