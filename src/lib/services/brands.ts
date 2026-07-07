import { z } from "zod"
import { getClient, revalidateAdmin } from "@/lib/server-utils"
import { parseSortParam, type ListParams, type ListResult } from "./base"

export const brandSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  ativo: z.boolean().default(true),
})

export type BrandInput = z.infer<typeof brandSchema>

export async function listBrands(filters: ListParams & { active?: string } = {}): Promise<ListResult<any>> {
  const { page = 1, limit = 50, search = "", sort = "name_asc", active } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sb = getClient()

  let query = sb.from("brands").select("*, products:products!products_brand_id_fkey(count)", { count: "exact" })
  if (search) query = query.ilike("name", `%${search}%`)
  if (active === "true") query = query.eq("ativo", true)
  else if (active === "false") query = query.eq("ativo", false)

  const sortConfig = parseSortParam(sort, "name_asc")
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, pageSize: limit }
}

export async function getBrand(id: string) {
  const sb = getClient()
  const { data, error } = await sb.from("brands").select("*, products:products!products_brand_id_fkey(count)").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createBrand(payload: BrandInput) {
  const parsed = brandSchema.parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("brands").insert(parsed).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/marcas")
  return data
}

export async function updateBrand(id: string, payload: Partial<BrandInput>) {
  const parsed = brandSchema.partial().parse(payload)
  const sb = getClient()
  const { data, error } = await sb.from("brands").update(parsed).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/marcas", `/admin/marcas/${id}`)
  return data
}

export async function deleteBrand(id: string) {
  const sb = getClient()
  const productCount = await sb.from("products").select("id", { count: "exact", head: true }).eq("brand_id", id)
  if ((productCount.count ?? 0) > 0) {
    throw new Error("Não é possível excluir marca com produtos vinculados. Desative-a.")
  }
  const { error } = await sb.from("brands").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/marcas")
  return { success: true }
}
