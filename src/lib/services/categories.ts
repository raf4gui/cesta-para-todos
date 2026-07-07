import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import { parseSortParam, type ListParams, type ListResult } from "./base"

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  ativo: z.boolean().default(true),
})

export type CategoryInput = z.infer<typeof categorySchema>

export async function listCategories(filters: ListParams & { active?: string } = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 50, search = "", sort = "name_asc", active } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb.from("categories").select("*, products:products!products_category_id_fkey(count)", { count: "exact" })
  if (search) query = query.ilike("name", `%${search}%`)
  if (active === "true") query = query.eq("ativo", true)
  else if (active === "false") query = query.eq("ativo", false)

  const sortConfig = parseSortParam(sort, "name_asc")
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getCategory(id: string) {
  const sb = getClient()
  const { data, error } = await sb.from("categories").select("*, products:products!products_category_id_fkey(count)").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(payload: CategoryInput) {
  const parsed = categorySchema.parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("categories").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/categorias")
  return data
}

export async function updateCategory(id: string, payload: Partial<CategoryInput>) {
  const parsed = categorySchema.partial().parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("categories").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/categorias", `/admin/categorias/${id}`)
  return data
}

export async function deleteCategory(id: string) {
  const sb = getClient()
  const productCount = await sb.from("products").select("id", { count: "exact", head: true }).eq("category_id", id)
  if ((productCount.count ?? 0) > 0) {
    throw new Error("Não é possível excluir categoria com produtos vinculados. Desative-a.")
  }
  const { error } = await sb.from("categories").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/categorias")
  return { success: true }
}
