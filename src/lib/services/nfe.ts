import { getClient, revalidateAdmin } from "@/lib/server-utils"

export interface NfeConfig {
  provider: string
  api_key?: string
  api_secret?: string
  environment: "producao" | "homologacao"
  serie_nfe: number
  serie_nfce: number
  ultimo_numero_nfe: number
  ultimo_numero_nfce: number
  cnpj?: string
  ie?: string
  company_name?: string
  sefaz_uf?: string
  sefaz_ambiente?: "producao" | "homologacao"
  sefaz_certificado?: string
  sefaz_certificado_senha?: string
}

export async function getNfeConfig(): Promise<NfeConfig | null> {
  const sb = getClient()
  const { data } = await sb.from("nfe_config").select("*").eq("id", true).single()
  if (!data) return null

  const { data: settings } = await sb.from("store_settings").select("cnpj, ie, company_name").single()
  return {
    provider: data.provider,
    api_key: data.api_key,
    api_secret: data.api_secret,
    environment: data.environment,
    serie_nfe: data.serie_nfe,
    serie_nfce: data.serie_nfce,
    ultimo_numero_nfe: data.ultimo_numero_nfe,
    ultimo_numero_nfce: data.ultimo_numero_nfce,
    cnpj: settings?.cnpj,
    ie: settings?.ie,
    company_name: settings?.company_name,
  }
}

export async function updateNfeConfig(config: Partial<NfeConfig>) {
  const sb = getClient()
  const { error } = await sb.from("nfe_config").upsert({ id: true, ...config, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidateAdmin("/admin/configuracoes")
  return { success: true }
}

export async function emitNfce(orderId: string) {
  const sb = getClient()
  const { data: order } = await sb.from("orders").select("*, customer:customers!orders_customer_id_fkey(*), items:order_items!order_items_order_id_fkey(*)").eq("id", orderId).single()
  if (!order) throw new Error("Pedido não encontrado")

  const config = await getNfeConfig()
  if (!config) throw new Error("Configuração NF-e não encontrada")

  const nextNumber = config.ultimo_numero_nfce + 1

  const { data: emission, error } = await sb
    .from("nfe_emissions")
    .insert({
      order_id: orderId,
      emission_type: "NFCE",
      status: "PENDENTE",
      number: nextNumber,
      serie: config.serie_nfce,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await sb.from("nfe_config").update({
    ultimo_numero_nfce: nextNumber,
    updated_at: new Date().toISOString(),
  }).eq("id", true)

  await sb.from("orders").update({
    nfce_number: String(nextNumber),
  }).eq("id", orderId)

  revalidateAdmin(`/admin/pedidos/${orderId}`, "/admin/configuracoes")
  return emission
}

export async function emitNfe(orderId: string) {
  const sb = getClient()
  const config = await getNfeConfig()
  if (!config) throw new Error("Configuração NF-e não encontrada")

  const nextNumber = config.ultimo_numero_nfe + 1

  const { data: emission, error } = await sb
    .from("nfe_emissions")
    .insert({
      order_id: orderId,
      emission_type: "NFE",
      status: "PENDENTE",
      number: nextNumber,
      serie: config.serie_nfe,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await sb.from("nfe_config").update({
    ultimo_numero_nfe: nextNumber,
    updated_at: new Date().toISOString(),
  }).eq("id", true)

  revalidateAdmin(`/admin/pedidos/${orderId}`, "/admin/configuracoes")
  return emission
}

export async function cancelNfe(emissionId: string) {
  const sb = getClient()
  const { data, error } = await sb
    .from("nfe_emissions")
    .update({ status: "CANCELED", updated_at: new Date().toISOString() })
    .eq("id", emissionId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function listNfeEmissions(orderId?: string) {
  const sb = getClient()
  let query = sb.from("nfe_emissions").select("*, order:orders!nfe_emissions_order_id_fkey(protocol, created_at, total_value, customer:customers!orders_customer_id_fkey(name, cpf_cnpj, phone, address, city))").order("created_at", { ascending: false })
  if (orderId) query = query.eq("order_id", orderId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
