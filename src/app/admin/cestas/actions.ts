"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { optionalUuid } from "@/lib/zod-helpers"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

function revalidateBasketPaths(basketId?: string) {
  revalidatePath("/admin/cestas")
  revalidatePath("/admin/cestas-prontas")
  revalidatePath("/admin/kits")
  revalidatePath("/admin/fardos")
  revalidatePath("/")
  if (basketId) {
    revalidatePath(`/admin/cestas/${basketId}`)
    revalidatePath(`/admin/cestas-prontas/${basketId}`)
    revalidatePath(`/admin/kits/${basketId}`)
    revalidatePath(`/admin/fardos/${basketId}`)
  }
}

const BASKET_TYPES = ["CESTA_PRATICA", "CESTA_COMPLETA", "CESTAO_FAMILIA", "CESTA_PERSONALIZADA", "KIT", "FARDO"] as const

const basketSchema = z.object({
  name: z.string().min(1), description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().nonnegative().default(0), image_url: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true), tipo: z.enum(BASKET_TYPES).default("CESTA_PRATICA"),
  brand_id: optionalUuid(), quantidade_fardo: z.coerce.number().int().positive().optional().nullable(),
  internal_price: z.coerce.number().nonnegative().optional().nullable(),
  show_price: z.boolean().default(true), show_catalog: z.boolean().default(true),
})

export async function listBaskets({ page = 1, limit = 25, search = "", sort = "created_at_desc", tipo, active }: any = {}) {
  const from = (page - 1) * limit, to = from + limit - 1
  let q = sb().from("baskets").select("*", { count: "exact" })
  if (search) q = q.ilike("name", `%${search}%`)
  if (tipo) {
    const tipos = tipo.split(",").filter(Boolean)
    if (tipos.length > 0) q = q.in("tipo", tipos)
  }
  if (active === "true") q = q.eq("ativo", true)
  else if (active === "false") q = q.eq("ativo", false)
  const sortMap: Record<string, any> = { created_at_desc: { column: "created_at", ascending: false }, created_at_asc: { column: "created_at", ascending: true }, name_asc: { column: "name", ascending: true }, name_desc: { column: "name", ascending: false }, price_asc: { column: "price", ascending: true }, price_desc: { column: "price", ascending: false } }
  q = q.order((sortMap[sort] || sortMap.created_at_desc).column, { ascending: (sortMap[sort] || sortMap.created_at_desc).ascending }).range(from, to)
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getBasket(id: string) {
  const { data: basket, error } = await sb().from("baskets").select("*").eq("id", id).maybeSingle()
  if (error) return { basket: null, items: [], allBrands: [] }
  if (!basket) return { basket: null, items: [], allBrands: [] }

  const { data: items } = await sb().from("basket_items").select("*, product:products(id, name, price, sale_price, image_url, brand_id, brand:brands!products_brand_id_fkey(id, name))").eq("basket_id", id)

  const itemsWithBrands = await Promise.all((items ?? []).map(async (item: any) => {
    const { data: brands } = await sb().from("basket_item_brands")
      .select("brand:brands!basket_item_brands_brand_id_fkey(id, name)").eq("basket_id", id).eq("product_id", item.product_id)
    return {
      ...item, product: Array.isArray(item.product) ? item.product[0] : item.product,
      allowed_brands: (brands ?? []).map((b: any) => Array.isArray(b.brand) ? b.brand[0] : b.brand),
    }
  }))

  const { data: allBrands } = await sb().from("brands").select("id, name").eq("ativo", true).order("name")

  return { basket, items: itemsWithBrands, allBrands: allBrands ?? [] }
}

export async function createBasket(payload: any) {
  const parsed = basketSchema.parse(payload)
  const { data, error } = await sb().from("baskets").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidateBasketPaths()
  return data
}

export async function updateBasket(id: string, payload: any) {
  const parsed = basketSchema.partial().parse(payload)
  const { data, error } = await sb().from("baskets").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateBasketPaths(id)
  return data
}

export async function deleteBasket(id: string) {
  const { error } = await sb().from("baskets").update({ ativo: false }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidateBasketPaths(id)
  return { success: true }
}

export async function toggleBasketStatus(id: string, ativo: boolean) {
  const { error } = await sb().from("baskets").update({ ativo }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidateBasketPaths(id)
  return { success: true }
}

export async function duplicateBasket(id: string) {
  const original = await getBasketRaw(id)
  const { data, error } = await sb().from("baskets").insert({
    name: `${original.name} (cópia)`,
    description: original.description,
    price: original.price,
    tipo: original.tipo,
    ativo: true,
    show_price: original.show_price,
    show_catalog: original.show_catalog,
    internal_price: original.internal_price,
    quantidade_fardo: original.quantidade_fardo,
    brand_id: original.brand_id,
  }).select().single()
  if (error) throw new Error(error.message)

  // Copy basket items
  const { data: items } = await sb().from("basket_items").select("*").eq("basket_id", id)
  if (items && items.length > 0) {
    const { error: ie } = await sb().from("basket_items").insert(
      items.map(i => ({
        basket_id: data.id, product_id: i.product_id, quantity: i.quantity,
        is_customizable: i.is_customizable,
      }))
    )
    if (ie) throw new Error(ie.message)
  }

  revalidateBasketPaths()
  return data
}

async function getBasketRaw(id: string) {
  const { data, error } = await sb().from("baskets").select("*").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function excludeBasket(id: string) {
  // Check FK dependencies
  const { count: oiCount } = await sb().from("order_items")
    .select("*", { count: "exact", head: true }).eq("basket_id", id)
  if (oiCount && oiCount > 0) {
    throw new Error(`Não é possível excluir: ${oiCount} pedido(s) referenciam esta cesta. Desative-a para removê-la do catálogo.`)
  }

  // Remove dependencies
  await sb().from("basket_items").delete().eq("basket_id", id)
  await sb().from("basket_item_brands").delete().eq("basket_id", id)

  // Remove image from storage
  const { data: basket } = await sb().from("baskets").select("image_url").eq("id", id).single()
  if (basket?.image_url) {
    const path = basket.image_url.split("/").pop()
    if (path) await sb().storage.from("images").remove([path])
  }

  // Hard delete
  const { error } = await sb().from("baskets").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidateBasketPaths()
  return { success: true }
}

export async function listAllProducts() {
  const { data } = await sb().from("products").select("id, name, price, sale_price, brand_id, brand:brands!products_brand_id_fkey(name)").eq("ativo", true).order("name")
  return data ?? []
}

export async function listAllBrands() {
  const { data } = await sb().from("brands").select("id, name").eq("ativo", true).order("name")
  return data ?? []
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

function validateImageFile(file: File) {
  if (!file) throw new Error("Nenhum arquivo enviado.")
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Formato não aceito: ${file.type || "desconhecido"}. Use JPG, JPEG, PNG ou WEBP.`)
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 10MB.`)
  }
}

async function uploadFile(formData: FormData, prefix: string): Promise<string> {
  const file = formData.get("file") as File
  validateImageFile(file)

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await sb().storage.from("images").upload(fileName, file, {
    contentType: file.type,
    upsert: true,
  })
  if (error) {
    if (error.message?.includes("policy")) {
      throw new Error("Upload negado pela política de segurança do Storage. Verifique as permissões do bucket 'images' no Supabase.")
    }
    if (error.message?.toLowerCase().includes("bucket") && error.message?.toLowerCase().includes("not found")) {
      const { error: createErr } = await sb().storage.createBucket("images", { public: true })
      if (createErr) throw new Error("Falha ao criar bucket: " + createErr.message)
      const { error: retryErr } = await sb().storage.from("images").upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      })
      if (retryErr) throw new Error("Falha no upload: " + retryErr.message)
    } else {
      throw new Error("Falha no upload: " + error.message)
    }
  }
  const { data } = sb().storage.from("images").getPublicUrl(fileName)
  return data.publicUrl
}

export async function uploadImage(formData: FormData) {
  return uploadFile(formData, "basket")
}

export async function uploadProductImage(formData: FormData) {
  return uploadFile(formData, "product")
}

export async function saveBasketItems(basketId: string, items: Array<{ product_id: string; quantity: number; is_customizable: boolean; allowed_brand_ids?: string[] }>) {
  await sb().from("basket_items").delete().eq("basket_id", basketId)
  await sb().from("basket_item_brands").delete().eq("basket_id", basketId)
  if (items.length === 0) { revalidateBasketPaths(basketId); return { success: true } }
  const { error } = await sb().from("basket_items").insert(items.map((i) => ({ basket_id: basketId, product_id: i.product_id, quantity: i.quantity, is_customizable: i.is_customizable })))
  if (error) throw new Error(error.message)
  for (const item of items) {
    if (item.allowed_brand_ids?.length) {
      const { error: be } = await sb().from("basket_item_brands").insert(item.allowed_brand_ids.map((bId) => ({ basket_id: basketId, product_id: item.product_id, brand_id: bId })))
      if (be) throw new Error(be.message)
    }
  }
  revalidateBasketPaths(basketId)
  return { success: true }
}
