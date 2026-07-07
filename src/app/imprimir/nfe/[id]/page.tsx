import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import { renderNfePrintHtml } from "@/lib/nfe-print"

export const dynamic = "force-dynamic"

export default async function ImprimirNfePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: emission } = await sb.from("nfe_emissions").select("*").eq("id", id).single()
  if (!emission) notFound()

  const { data: order } = await sb
    .from("orders")
    .select("*, customer:customers!orders_customer_id_fkey(*), items:order_items!order_items_order_id_fkey(*, product:products!order_items_product_id_fkey(name, peso, volume, unidade, brand:brands!products_brand_id_fkey(name)), chosen_brand:brands!order_items_chosen_brand_id_fkey(name))")
    .eq("id", emission.order_id)
    .single()

  if (!order) notFound()

  const html = renderNfePrintHtml(emission, order)

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
