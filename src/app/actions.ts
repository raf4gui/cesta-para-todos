"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/zod-helpers"

export async function getWhatsAppPhone() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb.from("store_settings").select("whatsapp_phone").eq("id", true).single()
  return data?.whatsapp_phone || ""
}

type BrandRow = { id: string; name: string }
type ProductRow = { id: string; name: string; brand?: BrandRow | BrandRow[] | null; peso?: string | null; volume?: string | null; unidade?: string | null }
type BasketItemRow = { basket_id: string; product_id: string; quantity: number; product?: { name: string; peso?: string | null; volume?: string | null; unidade?: string | null; brand?: BrandRow | BrandRow[] | null } | null }

export async function getPublicCatalogItems() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: baskets, error: basketsErr } = await sb
    .from("baskets")
    .select("id, name, description, image_url, tipo, brand_id, brand:brands!baskets_brand_id_fkey(name), quantidade_fardo")
    .eq("ativo", true)
    .eq("show_catalog", true)
    .order("name")

  if (basketsErr) {
    console.error("Catalog baskets query error:", basketsErr.message, basketsErr.details, basketsErr.hint)
    throw new Error(`Baskets query: ${basketsErr.message}`)
  }

  const basketIds = (baskets ?? []).map((b) => b.id)
  let basketItems: BasketItemRow[] = []

  if (basketIds.length > 0) {
    const { data: items, error: itemsErr } = await sb
      .from("basket_items")
      .select("basket_id, product_id, quantity, product:products(name, peso, volume, unidade, brand:brands!products_brand_id_fkey(name))")
      .in("basket_id", basketIds)

    if (!itemsErr && items) basketItems = items as any
  }

  const { data: catProducts, error: catErr } = await sb
    .from("products")
    .select("id, name, description, image_url, stock, sale_price, peso, volume, unidade, brand_id, brand:brands!products_brand_id_fkey(id, name), category:categories(name)")
    .eq("ativo", true)
    .order("name")

  if (catErr) {
    console.error("Catalog products query error:", catErr.message, catErr.details, catErr.hint)
    throw new Error(`Products query: ${catErr.message}`)
  }

  return { items: baskets ?? [], basketItems, products: catProducts ?? [] }
}

export async function getPublicProductsForCustomizer() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let products
  try {
    const { data, error: prodErr } = await sb
      .from("products")
      .select("id, name, description, image_url, stock, sale_price, purchase_price, peso, volume, unidade, brand_id, brand:brands!products_brand_id_fkey(id, name, ativo), category:categories(id, name)")
      .eq("ativo", true)
      .eq("allow_personalization", true)
      .order("personalization_order", { ascending: true })
      .order("name", { ascending: true })
    if (prodErr) throw prodErr
    products = data
  } catch {
    // Fallback if personalization_order column doesn't exist yet
    const { data, error: prodErr } = await sb
      .from("products")
      .select("id, name, description, image_url, stock, sale_price, purchase_price, peso, volume, unidade, brand_id, brand:brands!products_brand_id_fkey(id, name, ativo), category:categories(id, name)")
      .eq("ativo", true)
      .eq("allow_personalization", true)
      .order("name", { ascending: true })
    if (prodErr) throw prodErr
    products = data
  }

  const { data: brands, error: brandErr } = await sb
    .from("brands")
    .select("id, name")
    .eq("ativo", true)
    .order("name")

  if (brandErr) throw brandErr

  const productIds = (products ?? []).map(p => p.id)
  let productBrands: any[] = []
  if (productIds.length > 0) {
    const { data: pbs } = await sb
      .from("product_brands")
      .select("product_id, brand_id, brand:brands(id, name)")
      .in("product_id", productIds)
      .eq("ativo", true)
    if (pbs) productBrands = pbs
  }

  return { products: products ?? [], brands: brands ?? [], productBrands }
}

export async function getPublicBasketDetails(basketId: string) {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: basket, error: basketErr } = await sb
    .from("baskets")
    .select("id, name, description, image_url, tipo, brand_id, brand:brands!baskets_brand_id_fkey(name), quantidade_fardo")
    .eq("id", basketId)
    .eq("ativo", true)
    .single()

  if (basketErr) throw basketErr

  const { data: items, error: itemsErr } = await sb
    .from("basket_items")
    .select("*, product:products(id, name, sale_price, brand_id, brand:brands!products_brand_id_fkey(id, name), peso, volume, unidade)")
    .eq("basket_id", basketId)

  if (itemsErr) throw itemsErr

  const { data: itemBrands, error: itemBrandsErr } = await sb
    .from("basket_item_brands")
    .select("*, brand:brands!basket_item_brands_brand_id_fkey(id, name)")
    .eq("basket_id", basketId)

  if (itemBrandsErr) throw itemBrandsErr

  return { basket, items: items ?? [], itemBrands: itemBrands ?? [] }
}

export async function submitOrder(payload: {
  client_name: string
  client_phone: string
  basket_id?: string
  items: { product_id: string; quantity: number; chosen_brand_id?: string }[]
}) {
  console.log("=== SUBMIT ORDER ===")
  console.log("PASSO 1 - Nome recebido:", payload.client_name)
  console.log("PASSO 2 - Telefone recebido:", payload.client_phone)

  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // PASSO 3 - Telefone normalizado
  console.log("PASSO 3 - Normalizando telefone...")
  let cleanedPhone: string
  try {
    cleanedPhone = normalizePhone(payload.client_phone || "")
    console.log("   Telefone normalizado:", JSON.stringify(cleanedPhone))
  } catch (e) {
    console.error("   ERRO ao normalizar telefone:", e)
    throw e
  }

  // PASSO 4 - Procurando cliente
  console.log("PASSO 4 - Procurando cliente por telefone:", cleanedPhone)
  const { data: existing, error: lookupErr } = await sb
    .from("customers")
    .select("id, name, phone")
    .eq("phone", cleanedPhone)
    .limit(1)
    .maybeSingle()
  console.log("   lookupErr:", lookupErr?.message || "nenhum")

  // PASSO 5 - Cliente encontrado?
  console.log("PASSO 5 - Cliente encontrado?", existing ? `SIM (${existing.id.slice(0,8)} ${existing.name})` : "NAO")

  let customerId: string
  if (lookupErr && !lookupErr.message?.includes("PGRST116")) {
    console.error("   ERRO real na busca de cliente:", lookupErr)
    console.log("   ABORTANDO - cliente NAO sera criado, pedido NAO sera criado")
    throw new Error("Erro ao buscar cliente. Tente novamente.")
  }

  if (existing) {
    customerId = existing.id
    console.log("   Usando cliente existente ID:", customerId, "nome:", existing.name)
    // NÃO atualiza o nome - evita que pedidos pareçam mudar de dono
  } else {
    // PASSO 6 - Executando INSERT em customers
    console.log("PASSO 6 - Executando INSERT em customers...")
    console.log("   Dados: name=", payload.client_name, "phone=", cleanedPhone)
    const { data: customer, error: custErr } = await sb
      .from("customers")
      .insert({ name: payload.client_name, phone: cleanedPhone, ativo: true })
      .select()
      .single()
    if (custErr) {
      console.error("   ERRO no INSERT:", custErr.message, "code:", custErr.code)
      console.error("   Detalhes:", JSON.stringify(custErr))
      if (custErr.message?.includes("unique") || custErr.code === "23505") {
        console.log("   UNIQUE violation - retry...")
        const { data: retry } = await sb
          .from("customers")
          .select("id")
          .eq("phone", cleanedPhone)
          .limit(1)
          .maybeSingle()
        if (retry) {
          console.log("   Retry OK, cliente ID:", retry.id)
          customerId = retry.id
        } else {
          console.error("   Retry FALHOU - cliente nao encontrado apos UNIQUE violation")
          throw new Error("Erro ao criar cliente. Tente novamente.")
        }
      } else {
        console.log("   ERRO NAO RECUPERAVEL - abortando")
        throw custErr
      }
    } else {
      // PASSO 7 - INSERT realizado com sucesso
      console.log("PASSO 7 - INSERT realizado com sucesso!")
      console.log("   Customer ID:", customer.id)
      console.log("   Dados completos:", JSON.stringify(customer))
      customerId = customer.id
    }
  }

  // PASSO 8 - Criando pedido
  console.log("PASSO 8 - Criando pedido para customerId:", customerId)
  const { data: order, error: orderErr } = await sb
    .from("orders")
    .insert({
      customer_id: customerId,
      basket_id: payload.basket_id || null,
      status: "AGUARDANDO_CONTATO",
      origin: "ONLINE",
    })
    .select()
    .single()

  if (orderErr) {
    console.error("   ERRO ao criar pedido:", orderErr)
    throw orderErr
  }
  // PASSO 9 - Pedido criado
  console.log("PASSO 9 - Pedido criado com ID:", order.id, "customer_id:", order.customer_id)

  // Fetch product_brands prices for chosen brands (graceful fallback)
  const productIds = payload.items.map((i) => i.product_id)
  const brandIds = payload.items.map((i) => i.chosen_brand_id).filter((id): id is string => Boolean(id))

  const brandPrices: Record<string, { sale_price: number; purchase_price: number }> = {}
  if (brandIds.length > 0) {
    try {
      const { data: pbs } = await sb
        .from("product_brands")
        .select("product_id, brand_id, sale_price, purchase_price")
        .in("product_id", productIds)
        .in("brand_id", brandIds)
      for (const pb of pbs ?? []) {
        const key = `${pb.product_id}_${pb.brand_id}`
        brandPrices[key] = { sale_price: Number(pb.sale_price) || 0, purchase_price: Number(pb.purchase_price) || 0 }
      }
    } catch {
      // product_brands table may not exist yet
    }
  }

  // Fetch default product prices for fallback
  const { data: products } = await sb
    .from("products")
    .select("id, name, sale_price, purchase_price, brand_id, brand:brands!products_brand_id_fkey(id, name), peso, volume, unidade")
    .in("id", productIds)

  const productsMap = (products ?? []).reduce<Record<string, any>>((acc, p) => ({ ...acc, [p.id]: p }), {})

  const orderItemsRows = payload.items.map((item) => {
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
  if (itemsErr) throw itemsErr

  const { data: fullOrder, error: fullOrderErr } = await sb
    .from("orders")
    .select("*, basket:baskets(name)")
    .eq("id", order.id)
    .single()

  if (fullOrderErr) throw fullOrderErr

  const messageText = [
    `Olá.`,
    ``,
    `Acabei de realizar um pedido pelo site Cesta Para Todos.`,
    ``,
    `Meu nome é ${payload.client_name}.`,
    ``,
    `Meu protocolo é ${fullOrder.protocol}.`,
    ``,
    `Aguardo o retorno para confirmação do pedido.`,
  ].join("\n")
  const { data: settings } = await supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!).from("store_settings").select("whatsapp_phone").eq("id", true).single()
  const storePhone = settings?.whatsapp_phone || ""
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${storePhone}&text=${encodeURIComponent(messageText)}`

  // PASSO 10 - Redirecionando para WhatsApp
  console.log("PASSO 10 - Redirecionando para WhatsApp")
  console.log("   Protocolo do pedido:", fullOrder.protocol)
  console.log("   WhatsApp URL gerada")
  console.log("=== SUBMIT ORDER FIM (SUCESSO) ===")

  return {
    id: order.id,
    protocol: fullOrder.protocol,
    client_name: payload.client_name,
    client_phone: payload.client_phone,
    basket_name: fullOrder.basket?.name,
    whatsapp_url: whatsappUrl,
  }
}
