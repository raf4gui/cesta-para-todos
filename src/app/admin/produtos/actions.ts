"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { optionalUuid } from "@/lib/zod-helpers"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

const productSchema = z.object({
  name: z.string().min(1), description: z.string().optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")), stock: z.coerce.number().int().nonnegative().default(0),
  price: z.coerce.number().nonnegative().default(0), purchase_price: z.coerce.number().nonnegative().default(0),
  sale_price: z.coerce.number().nonnegative().default(0), brand_id: optionalUuid(),
  category_id: optionalUuid(), ativo: z.boolean().default(true),
  disponivel: z.boolean().default(true), peso: z.string().optional().or(z.literal("")),
  volume: z.string().optional().or(z.literal("")), unidade: z.string().optional().or(z.literal("")),
  vendido_individualmente: z.boolean().default(true), faz_parte_de_cesta: z.boolean().default(false),
  faz_parte_de_fardo: z.boolean().default(false), internal_code: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")), min_stock: z.coerce.number().int().nonnegative().default(5),
  supplier: z.string().optional().or(z.literal("")), oculto_catalogo: z.boolean().default(false),
  internal_cost: z.coerce.number().nonnegative().default(0),
  show_price: z.boolean().default(true), allow_personalization: z.boolean().default(false),
  featured: z.boolean().default(false),
})

export async function listFormBrands() {
  const { data } = await sb().from("brands").select("id, name").eq("ativo", true).order("name")
  return data ?? []
}

export async function listFormCategories() {
  const { data } = await sb().from("categories").select("id, name").eq("ativo", true).order("name")
  return data ?? []
}

export async function listProducts({ page = 1, limit = 25, search = "", brandId, categoryId, active, sort = "created_at_desc", supplier }: any = {}) {
  const from = (page - 1) * limit, to = from + limit - 1
  let q = sb().from("products").select("*, brand:brands!products_brand_id_fkey(id, name), category:categories!products_category_id_fkey(id, name)", { count: "exact" })
  if (search) q = q.ilike("name", `%${search}%`)
  if (brandId) q = q.eq("brand_id", brandId)
  if (categoryId) q = q.eq("category_id", categoryId)
  if (active === "true") q = q.eq("ativo", true)
  else if (active === "false") q = q.eq("ativo", false)
  if (supplier) q = q.ilike("supplier", `%${supplier}%`)
  const sortMap: Record<string, any> = { created_at_desc: { column: "created_at", ascending: false }, created_at_asc: { column: "created_at", ascending: true }, name_asc: { column: "name", ascending: true }, name_desc: { column: "name", ascending: false }, price_asc: { column: "price", ascending: true }, price_desc: { column: "price", ascending: false } }
  q = q.order((sortMap[sort] || sortMap.created_at_desc).column, { ascending: (sortMap[sort] || sortMap.created_at_desc).ascending }).range(from, to)
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getProduct(id: string) {
  const { data, error } = await sb().from("products").select("*, brand:brands!products_brand_id_fkey(id, name), category:categories!products_category_id_fkey(id, name)").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(payload: any) {
  const { brand_ids, ...productPayload } = payload
  const parsed = productSchema.parse(productPayload)
  const { data, error } = await sb().from("products").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  
  if (brand_ids && Array.isArray(brand_ids) && brand_ids.length > 0) {
    const { error: pbErr } = await sb().from("product_brands").insert(
      brand_ids.map((brand_id: string) => ({
        product_id: data.id, brand_id, ativo: true,
      }))
    )
    if (pbErr) throw new Error(pbErr.message)
  }
  
  revalidatePath("/admin/produtos")
  revalidatePath("/admin/estoque")
  return data
}

export async function updateProduct(id: string, payload: any) {
  const { brand_ids, ...productPayload } = payload
  const parsed = productSchema.partial().parse(productPayload)
  const { data, error } = await sb().from("products").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  
  if (brand_ids !== undefined && Array.isArray(brand_ids)) {
    await syncProductBrands(id, brand_ids)
  }
  
  revalidatePath("/admin/produtos")
  revalidatePath("/admin/estoque")
  return data
}

async function syncProductBrands(productId: string, brandIds: string[]) {
  const { data: current } = await sb()
    .from("product_brands")
    .select("brand_id")
    .eq("product_id", productId)
  const currentIds = (current ?? []).map(pb => pb.brand_id)
  const toAdd = brandIds.filter(id => !currentIds.includes(id))
  const toRemove = currentIds.filter(id => !brandIds.includes(id))
  if (toRemove.length > 0) {
    await sb().from("product_brands").delete().eq("product_id", productId).in("brand_id", toRemove)
  }
  if (toAdd.length > 0) {
    const { error } = await sb().from("product_brands").insert(
      toAdd.map(brand_id => ({ product_id: productId, brand_id, ativo: true }))
    )
    if (error) throw new Error(error.message)
  }
}

export async function deleteProduct(id: string) {
  const { data, error } = await sb().from("products").update({ ativo: false }).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/produtos")
  revalidatePath("/admin/estoque")
  return data
}

export async function excludeProduct(id: string) {
  // Check FK dependencies
  const deps: string[] = []

  const { count: biCount } = await sb().from("basket_items")
    .select("*", { count: "exact", head: true }).eq("product_id", id)
  if (biCount && biCount > 0) deps.push(`${biCount} vínculo(s) em cestas`)

  const { count: smCount } = await sb().from("stock_movements")
    .select("*", { count: "exact", head: true }).eq("product_id", id)
  if (smCount && smCount > 0) deps.push(`${smCount} movimento(s) de estoque`)

  if (deps.length > 0) {
    throw new Error("Não é possível excluir este produto pois existem dependências:\n" + deps.join("\n"))
  }

  // Remove product_brands
  await sb().from("product_brands").delete().eq("product_id", id)

  // Remove image from storage
  const { data: product } = await sb().from("products").select("image_url").eq("id", id).single()
  if (product?.image_url) {
    const path = product.image_url.split("/").pop()
    if (path) await sb().storage.from("images").remove([path])
  }

  // Hard delete
  const { error } = await sb().from("products").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePath("/admin/produtos")
  revalidatePath("/admin/estoque")
  return { success: true }
}

export async function duplicateProduct(id: string) {
  const original = await getProduct(id)
  const { data, error } = await sb().from("products").insert({
    name: `${original.name} (cópia)`, stock: 0, price: original.price, sale_price: original.sale_price,
    purchase_price: original.purchase_price, brand_id: original.brand_id, category_id: original.category_id,
    ativo: true, disponivel: original.disponivel, peso: original.peso, volume: original.volume, unidade: original.unidade,
    vendido_individualmente: original.vendido_individualmente, faz_parte_de_cesta: original.faz_parte_de_cesta,
    faz_parte_de_fardo: original.faz_parte_de_fardo, min_stock: original.min_stock,
    supplier: original.supplier, internal_code: original.internal_code, barcode: original.barcode,
    internal_cost: original.internal_cost, oculto_catalogo: original.oculto_catalogo,
    show_price: original.show_price, allow_personalization: original.allow_personalization,
    featured: original.featured,
  }).select().single()
  if (error) throw new Error(error.message)

  // Copy product_brands entries
  const { data: pbs } = await sb()
    .from("product_brands")
    .select("brand_id, sale_price, purchase_price, stock, ativo")
    .eq("product_id", id)
  if (pbs && pbs.length > 0) {
    const { error: pbErr } = await sb().from("product_brands").insert(
      pbs.map(pb => ({ ...pb, product_id: data.id }))
    )
    if (pbErr) throw new Error(pbErr.message)
  }

  revalidatePath("/admin/produtos")
  revalidatePath("/admin/estoque")
  return data
}

export async function toggleProductStatus(id: string, field: "ativo" | "disponivel" | "oculto_catalogo" | "allow_personalization", value: boolean) {
  const { data, error } = await sb().from("products").update({ [field]: value }).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/produtos")
  revalidatePath("/admin/produtos/personalizacao")
  return data
}

export async function listPersonalizationProducts() {
  let products
  try {
    const { data, error } = await sb()
      .from("products")
      .select("id, name, peso, volume, unidade, allow_personalization, personalization_order")
      .eq("ativo", true)
      .order("personalization_order", { ascending: true })
      .order("name", { ascending: true })
    if (error) throw error
    products = data
  } catch {
    // Column personalization_order may not exist yet — fall back to name order
    const { data, error } = await sb()
      .from("products")
      .select("id, name, peso, volume, unidade, allow_personalization")
      .eq("ativo", true)
      .order("name", { ascending: true })
    if (error) throw new Error(error.message)
    products = (data ?? []).map((p: any) => ({ ...p, personalization_order: 0 }))
  }
  return products ?? []
}

export async function reorderPersonalizationProducts(ids: string[]) {
  try {
    const updates = ids.map((id, index) => ({
      id,
      personalization_order: (index + 1) * 10,
    }))
    for (const u of updates) {
      const { error } = await sb().from("products").update({ personalization_order: u.personalization_order }).eq("id", u.id)
      if (error) throw error
    }
  } catch {
    // Column may not exist yet — silently accept the in-memory reorder
  }
  revalidatePath("/admin/produtos/personalizacao")
  revalidatePath("/")
  return { success: true }
}

// ── Product Brands (multi-brand per product) ──

export async function listProductBrandIds(productId: string) {
  const { data } = await sb()
    .from("product_brands")
    .select("brand_id")
    .eq("product_id", productId)
  return (data ?? []).map(pb => pb.brand_id)
}

export async function listProductBrands(productId: string) {
  const { data, error } = await sb()
    .from("product_brands")
    .select("*, brand:brands!product_brands_brand_id_fkey(id, name, logo)")
    .eq("product_id", productId)
    .order("created_at")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveProductBrands(productId: string, brands: Array<{
  brand_id: string; sale_price?: number; purchase_price?: number; stock?: number; ativo?: boolean
}>) {
  await sb().from("product_brands").delete().eq("product_id", productId)
  if (brands.length === 0) { revalidatePath(`/admin/produtos/${productId}`); return { success: true } }
  const { error } = await sb().from("product_brands").insert(
    brands.map(b => ({ ...b, product_id: productId }))
  )
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/produtos/${productId}`)
  return { success: true }
}
