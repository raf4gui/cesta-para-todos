"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

const categorySchema = z.object({ name: z.string().min(1), description: z.string().optional().or(z.literal("")), image: z.string().optional().or(z.literal("")), ativo: z.boolean().default(true) })

export async function listCategories({ page = 1, limit = 50, search = "", sort = "name_asc", active }: any = {}) {
  const from = (page - 1) * limit, to = from + limit - 1
  let q = sb().from("categories").select("*, products:products!products_category_id_fkey(count)", { count: "exact" })
  if (search) q = q.ilike("name", `%${search}%`)
  if (active === "true") q = q.eq("ativo", true)
  else if (active === "false") q = q.eq("ativo", false)
  const sortMap: Record<string, any> = { name_asc: { column: "name", ascending: true }, name_desc: { column: "name", ascending: false }, created_at_desc: { column: "created_at", ascending: false } }
  const sc = sortMap[sort] || sortMap.name_asc
  q = q.order(sc.column, { ascending: sc.ascending }).range(from, to)
  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getCategory(id: string) {
  const { data, error } = await sb().from("categories").select("*, products:products!products_category_id_fkey(count)").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(payload: any) {
  const parsed = categorySchema.parse(payload)
  const { data, error } = await sb().from("categories").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/categorias")
  revalidatePath("/admin/produtos")
  return data
}

export async function updateCategory(id: string, payload: any) {
  const parsed = categorySchema.partial().parse(payload)
  const { data, error } = await sb().from("categories").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/categorias")
  revalidatePath("/admin/produtos")
  return data
}

export async function deleteCategory(id: string) {
  const { count } = await sb().from("products").select("id", { count: "exact", head: true }).eq("category_id", id)
  const { error } = await sb().from("categories").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/categorias")
  revalidatePath("/admin/produtos")
  return { success: true, affectedProducts: count ?? 0 }
}
