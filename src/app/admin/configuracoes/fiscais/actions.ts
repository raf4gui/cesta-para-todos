"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase"

export type NfeConfig = {
  provider?: string
  environment?: string
  serie_nfe?: number
  serie_nfce?: number
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  ie?: string
  im?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  telefone?: string
  email?: string
  regime_tributario?: string
  observacoes_padrao?: string
  logo_url?: string
  sefaz_uf?: string
  sefaz_ambiente?: "producao" | "homologacao"
  sefaz_certificado?: string
  sefaz_certificado_senha?: string
}

export async function getNfeConfig(): Promise<NfeConfig> {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("nfe_config").select("*").eq("id", true).single()
  if (error || !data) return {}
  return data
}

export async function updateNfeConfig(config: Partial<NfeConfig>) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb
    .from("nfe_config")
    .upsert({ id: true, ...config, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath("/admin/configuracoes/fiscais")
  revalidatePath("/admin/nfe")
  return { success: true }
}
