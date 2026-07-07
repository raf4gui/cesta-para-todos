"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function emitNfe(invoiceId: string) {
  const { data: invoice } = await sb().from("nfe_emissions").select("*, order:orders(protocol, status, payment_status, total_value)").eq("id", invoiceId).single()
  if (!invoice) throw new Error("Nota fiscal não encontrada")
  if (invoice.status !== "PENDENTE") throw new Error("Apenas notas pendentes podem ser emitidas")

  const { data, error } = await sb().from("nfe_emissions").update({
    status: "AUTHORIZED",
    issued_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", invoiceId).select().single()

  if (error) throw new Error(error.message)
  revalidatePath("/admin/nfe")
  revalidatePath(`/admin/pedidos/${invoice.order_id}`)
  return data
}

export async function cancelNfe(invoiceId: string) {
  const { data: invoice } = await sb().from("nfe_emissions").select("*, order:orders(protocol)").eq("id", invoiceId).single()
  if (!invoice) throw new Error("Nota fiscal não encontrada")
  if (invoice.status === "CANCELED") throw new Error("Nota já está cancelada")

  const { data, error } = await sb().from("nfe_emissions").update({
    status: "CANCELED",
    updated_at: new Date().toISOString(),
  }).eq("id", invoiceId).select().single()

  if (error) throw new Error(error.message)
  revalidatePath("/admin/nfe")
  revalidatePath(`/admin/pedidos/${invoice.order_id}`)
  return data
}

export async function getNfeInvoice(invoiceId: string) {
  const { data, error } = await sb()
    .from("nfe_emissions")
    .select("*, order:orders!nfe_emissions_order_id_fkey(*, customer:customers!orders_customer_id_fkey(*), items:order_items!order_items_order_id_fkey(*, product:products!order_items_product_id_fkey(name, peso, volume, unidade, brand:brands!products_brand_id_fkey(name)), chosen_brand:brands!order_items_chosen_brand_id_fkey(name)))")
    .eq("id", invoiceId)
    .single()
  if (error) throw new Error(error.message)
  return data
}
