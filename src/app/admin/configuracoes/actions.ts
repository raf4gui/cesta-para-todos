"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase"

export type StoreSettings = {
  whatsapp_phone: string
  support_email: string
  address_line: string
  city_state: string
  hero_image_url?: string
  hero_title: string
  hero_subtitle: string
  company_name: string
  institutional_text: string
  logo_url: string
  facebook?: string
  instagram?: string
  youtube?: string
  tiktok?: string
  cnpj?: string
  ie?: string
  company_phone?: string
  fiscal_email?: string
  show_prices?: boolean
  show_stock?: boolean
  show_availability?: boolean
  whatsapp_message_template?: string
  emitir_nota_automaticamente?: boolean
  printer_type?: "a4" | "thermal_58mm" | "thermal_80mm"
  auto_print_order?: boolean
  print_show_logo?: boolean
  print_show_notes?: boolean
  print_show_phone?: boolean
  print_show_address?: boolean
  print_show_qrcode?: boolean
}

const DEFAULTS: StoreSettings = {
  whatsapp_phone: "",
  support_email: "suporte@cestaparatodos.com",
  address_line: "Carnaíba de Baixo",
  city_state: "Pindobaçu - Bahia",
  hero_image_url: "",
  hero_title: "Cesta básica personalizada, pronta para pedir pelo celular.",
  hero_subtitle: "Escolha a cesta, informe as marcas de preferência e fale direto com a loja para combinar entrega em Pindobaçu e região.",
  company_name: "Cesta para Todos",
  institutional_text: "Cestas básicas e kits montados para famílias, empresas e compras recorrentes. Soluções práticas e atendimento de excelência.",
  logo_url: "/WheelSexta.png",
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  cnpj: "",
  ie: "",
  company_phone: "",
  fiscal_email: "",
  show_prices: true,
  show_stock: true,
  show_availability: true,
  whatsapp_message_template: "",
  emitir_nota_automaticamente: true,
  printer_type: "a4",
  auto_print_order: false,
  print_show_logo: true,
  print_show_notes: true,
  print_show_phone: true,
  print_show_address: true,
  print_show_qrcode: true,
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from("store_settings").select("*").eq("id", true).single()

  if (error) return { ...DEFAULTS }

  return {
    ...DEFAULTS,
    ...data,
    company_name: data.company_name || DEFAULTS.company_name,
    institutional_text: data.institutional_text || DEFAULTS.institutional_text,
    logo_url: data.logo_url || DEFAULTS.logo_url,
  }
}

export async function getStoreWhatsAppPhone(): Promise<string> {
  const settings = await getStoreSettings()
  return settings.whatsapp_phone
}

export async function updateStoreSettings(payload: Partial<StoreSettings>) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb
    .from("store_settings")
    .upsert({ id: true, ...payload, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/")
  revalidatePath("/admin/configuracoes")
  return data
}

export async function updateNfeConfig(config: any) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from("nfe_config").upsert({ id: true, ...config, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath("/admin/configuracoes")
  return { success: true }
}
