"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
const brandSchema = z.object({ name: z.string().min(1), description: z.string().optional().or(z.literal("")), logo: z.string().optional().or(z.literal("")), ativo: z.boolean().default(true) })

export async function listBrands({ page = 1, limit = 50, search = "", sort = "name_asc", active }: any = {}) {
  const from = (page - 1) * limit, to = from + limit - 1
  let q = sb().from("brands").select("*, products:products!products_brand_id_fkey(count)", { count: "exact" })
  if (search) q = q.ilike("name", `%${search}%`)
  if (active === "true") q = q.eq("ativo", true)
  else if (active === "false") q = q.eq("ativo", false)
  const sortMap: Record<string, any> = { name_asc: { column: "name", ascending: true }, name_desc: { column: "name", ascending: false }, created_at_desc: { column: "created_at", ascending: false } }
  q = q.order((sortMap[sort] || sortMap.name_asc).column, { ascending: (sortMap[sort] || sortMap.name_asc).ascending }).range(from, to)
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getBrand(id: string) {
  const { data, error } = await sb().from("brands").select("*, products:products!products_brand_id_fkey(count)").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createBrand(payload: any) {
  const parsed = brandSchema.parse(payload)
  const { data, error } = await sb().from("brands").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/marcas")
  revalidatePath("/admin/produtos")
  return data
}

export async function updateBrand(id: string, payload: any) {
  const parsed = brandSchema.partial().parse(payload)
  const { data, error } = await sb().from("brands").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/marcas")
  revalidatePath("/admin/produtos")
  return data
}

export async function deleteBrand(id: string) {
  const { count } = await sb().from("products").select("id", { count: "exact", head: true }).eq("brand_id", id)
  const { error } = await sb().from("brands").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/marcas")
  revalidatePath("/admin/produtos")
  return { success: true, affectedProducts: count ?? 0 }
}
