import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/zod-helpers"
import { appendFileSync } from "fs"
import { resolve } from "path"

const LOG = resolve(process.cwd(), "api-place-order.log")

function log(msg: string) {
  try { appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`) } catch {}
}

export async function POST(request: NextRequest) {
  log("=== INICIO ===")
  log(`URL: ${request.url}`)
  log(`Method: ${request.method}`)
  log(`Headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()))}`)

  try {
    const rawBody = await request.text()
    log(`Raw body: ${rawBody}`)

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      log("ERRO: JSON invalido")
      return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
    }

    const { client_name, client_phone, basket_id, items } = body
    log(`Parsed client_name: ${JSON.stringify(client_name)}`)
    log(`Parsed client_phone: ${JSON.stringify(client_phone)}`)

    if (!client_name || !client_phone) {
      log(`ERRO: campos obrigatorios faltando`)
      return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 })
    }

    const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

    let cleanedPhone: string
    try {
      cleanedPhone = normalizePhone(client_phone || "")
    } catch {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
    }
    log(`Cleaned phone: ${cleanedPhone}`)

    const { data: existing } = await sb
      .from("customers")
      .select("id, name, phone")
      .eq("phone", cleanedPhone)
      .limit(1)
      .maybeSingle()

    log(`Existing customer for ${cleanedPhone}: ${existing ? existing.id.slice(0,8) + " " + existing.name : "NONE"}`)

    let customerId: string

    if (existing) {
      customerId = existing.id
      log(`Reusing customer: ${customerId.slice(0,8)}`)
    } else {
      log(`Inserting new customer: name=${client_name}, phone=${cleanedPhone}`)
      const { data: customer, error: custErr } = await sb
        .from("customers")
        .insert({ name: client_name, phone: cleanedPhone, ativo: true })
        .select()
        .single()

      if (custErr) {
        log(`Insert error: ${custErr.message} (code=${custErr.code})`)
        if (custErr.message?.includes("unique") || custErr.code === "23505") {
          const { data: retry } = await sb
            .from("customers")
            .select("id")
            .eq("phone", cleanedPhone)
            .limit(1)
            .maybeSingle()
          if (retry) {
            customerId = retry.id
            log(`Retry found existing: ${customerId.slice(0,8)}`)
          } else {
            return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: custErr.message }, { status: 500 })
        }
      } else {
        customerId = customer.id
        log(`New customer created: ${customerId.slice(0,8)}`)
      }
    }

    const { data: order, error: orderErr } = await sb
      .from("orders")
      .insert({
        customer_id: customerId,
        basket_id: basket_id || null,
        status: "AGUARDANDO_CONTATO",
        origin: "ONLINE",
      })
      .select()
      .single()

    if (orderErr) {
      log(`Order insert error: ${orderErr.message}`)
      return NextResponse.json({ error: orderErr.message }, { status: 500 })
    }
    log(`Order created: ${order.id.slice(0,8)} protocol=${order.protocol}`)

    if (items && items.length > 0) {
      const productIds = items.map((i: any) => i.product_id)
      const brandIds = items.map((i: any) => i.chosen_brand_id).filter((id: any) => Boolean(id))

      const brandPrices: Record<string, { sale_price: number; purchase_price: number }> = {}
      if (brandIds.length > 0) {
        try {
          const { data: pbs } = await sb
            .from("product_brands")
            .select("product_id, brand_id, sale_price, purchase_price")
            .in("product_id", productIds)
            .in("brand_id", brandIds)
          for (const pb of pbs ?? []) {
            brandPrices[`${pb.product_id}_${pb.brand_id}`] = {
              sale_price: Number(pb.sale_price) || 0,
              purchase_price: Number(pb.purchase_price) || 0,
            }
          }
        } catch {}
      }

      const { data: products } = await sb
        .from("products")
        .select("id, name, sale_price, purchase_price, brand_id, brand:brands!products_brand_id_fkey(id, name), peso, volume, unidade")
        .in("id", productIds)

      const productsMap = (products ?? []).reduce<Record<string, any>>((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})

      const orderItemsRows = items.map((item: any) => {
        const prod = productsMap[item.product_id]
        const priceKey = `${item.product_id}_${item.chosen_brand_id}`
        const brandPrice = item.chosen_brand_id ? brandPrices[priceKey] : null
        const unitPrice = brandPrice?.sale_price || Number(prod?.sale_price) || 0
        const unitCost = brandPrice?.purchase_price || Number(prod?.purchase_price) || 0
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          chosen_brand_id: item.chosen_brand_id || null,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          unit_cost: unitCost,
          total_profit: (unitPrice - unitCost) * item.quantity,
          name: prod?.name || "",
        }
      })

      const { error: itemsErr } = await sb.from("order_items").insert(orderItemsRows)
      if (itemsErr) {
        log(`Order items insert error: ${itemsErr.message}`)
        return NextResponse.json({ error: itemsErr.message }, { status: 500 })
      }
      log(`Order items inserted: ${orderItemsRows.length}`)
    }

    const { data: fullOrder } = await sb
      .from("orders")
      .select("*, basket:baskets!orders_basket_id_fkey(name)")
      .eq("id", order.id)
      .maybeSingle()

    const messageText = [
      `Olá.`,
      ``,
      `Acabei de realizar um pedido pelo site Cesta Para Todos.`,
      ``,
      `Meu nome é ${client_name}.`,
      ``,
      `Meu protocolo é ${fullOrder?.protocol || order.id.slice(0, 8).toUpperCase()}.`,
      ``,
      `Aguardo o retorno para confirmação do pedido.`,
    ].join("\n")
    const { data: settings } = await supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!).from("store_settings").select("whatsapp_phone").eq("id", true).maybeSingle()
    const storePhone = settings?.whatsapp_phone || ""
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${storePhone}&text=${encodeURIComponent(messageText)}`

    log(`Response: customer=${customerId.slice(0,8)} protocol=${fullOrder?.protocol}`)
    log("=== FIM ===")

    return NextResponse.json({
      id: order.id,
      protocol: fullOrder?.protocol,
      client_name,
      client_phone,
      basket_name: fullOrder?.basket?.name,
      whatsapp_url: whatsappUrl,
      customer_id: customerId,
      _version: "api-route-v2",
    })
  } catch (err: any) {
    log(`UNCAUGHT ERROR: ${err.message}\n${err.stack}`)
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
