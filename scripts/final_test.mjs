/**
 * TESTE FINAL: Valida o fluxo completo de 4 cenários.
 * 
 * 1. Maria (74999999999) → cria cliente
 * 2. José (74888888888) → cria cliente
 * 3. Carlos (74777777777) → cria cliente
 * 4. Maria novamente (74999999999) → reusa cliente
 * 
 * Resultado esperado:
 * - 3 clientes na tabela
 * - 4 pedidos, cada um com seu customer_id
 * - Maria e José não se misturam
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env.local")
const content = readFileSync(envPath, "utf-8")
const vars = {}
for (const line of content.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let value = trimmed.slice(eqIdx + 1).trim()
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
  vars[key] = value
}

function normalizePhone(phone) {
  const cleaned = (phone || "").replace(/\D/g, "")
  if (!cleaned) throw new Error("Telefone invalido")
  return cleaned
}

const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY)

async function submitOrder(clientName, clientPhone) {
  const cleanedPhone = normalizePhone(clientPhone)

  const { data: existing } = await sb
    .from("customers")
    .select("id, name, phone")
    .eq("phone", cleanedPhone)
    .limit(1)
    .maybeSingle()

  let customerId
  if (existing) {
    customerId = existing.id
    console.log(`   REUSOU: ${existing.id.slice(0,8)} (${existing.name})`)
  } else {
    const { data: customer, error: custErr } = await sb
      .from("customers")
      .insert({ name: clientName, phone: cleanedPhone, ativo: true })
      .select()
      .single()
    
    if (custErr) throw new Error(`INSERT failed: ${custErr.message}`)
    customerId = customer.id
    console.log(`   CRIOU: ${customer.id.slice(0,8)} (${customer.name})`)
  }

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .insert({
      customer_id: customerId,
      basket_id: null,
      status: "AGUARDANDO_CONTATO",
      origin: "ONLINE",
    })
    .select()
    .single()

  if (orderErr) throw new Error(`Order failed: ${orderErr.message}`)
  console.log(`   PEDIDO: ${order.protocol} → customer ${customerId.slice(0,8)}`)

  return { customerId, orderId: order.id, protocol: order.protocol }
}

async function main() {
  console.log("=".repeat(70))
  console.log("TESTE FINAL - 4 CENARIOS")
  console.log("=".repeat(70))

  // Clean previous test data
  const phones = ["74999999999", "74888888888", "74777777777"]
  for (const phone of phones) {
    const { data: c } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      await sb.from("orders").delete().eq("customer_id", c.id)
      await sb.from("customers").delete().eq("id", c.id)
    }
  }
  console.log("Dados anteriores limpos.\n")

  // CENARIO 1: Maria
  console.log("1. MARIA (74999999999)")
  const m1 = await submitOrder("Maria", "74999999999")

  // CENARIO 2: José
  console.log("\n2. JOSÉ (74888888888)")
  const j1 = await submitOrder("José", "74888888888")

  // CENARIO 3: Carlos
  console.log("\n3. CARLOS (74777777777)")
  const c1 = await submitOrder("Carlos", "74777777777")

  // CENARIO 4: Maria novamente
  console.log("\n4. MARIA NOVAMENTE (74999999999)")
  const m2 = await submitOrder("Maria", "74999999999")

  // VERIFICACAO
  console.log("\n" + "=".repeat(70))
  console.log("VERIFICACAO")
  console.log("=".repeat(70))

  // Check customers
  const { data: customers } = await sb
    .from("customers")
    .select("id, name, phone, ativo")
    .in("phone", phones)
    .order("created_at", { ascending: true })

  console.log("\nClientes criados:", customers?.length)
  for (const c of customers || []) {
    console.log(`   [${c.id.slice(0,8)}] ${c.name} - ${c.phone} (ativo: ${c.ativo})`)
  }

  // Check orders
  const { data: orders } = await sb
    .from("orders")
    .select("id, protocol, customer_id, customer:customers!orders_customer_id_fkey(name, phone)")
    .in("id", [m1.orderId, j1.orderId, c1.orderId, m2.orderId])
    .order("created_at", { ascending: true })

  console.log("\nPedidos:")
  for (const o of orders || []) {
    console.log(`   ${o.protocol} → customer: ${o.customer?.name || "SEM NOME"} (${o.customer?.phone || "NENHUM"})`)
  }

  // ASSERTIONS
  console.log("\n" + "=".repeat(70))
  console.log("ASSERCOES")
  console.log("=".repeat(70))

  const passed = []
  const failed = []

  // 1. Maria e José devem ser clientes DIFERENTES
  const mariaCustomers = customers?.filter(c => c.name === "Maria") || []
  const joseCustomers = customers?.filter(c => c.name === "José") || []
  const carlosCustomers = customers?.filter(c => c.name === "Carlos") || []

  if (mariaCustomers.length >= 1) {
    passed.push("Maria existe como cliente")
  } else {
    failed.push("Maria NAO existe como cliente")
  }

  if (joseCustomers.length >= 1) {
    passed.push("José existe como cliente")
  } else {
    failed.push("José NAO existe como cliente")
  }

  if (carlosCustomers.length >= 1) {
    passed.push("Carlos existe como cliente")
  } else {
    failed.push("Carlos NAO existe como cliente")
  }

  // 2. Maria deve ter o MESMO customer_id nos 2 pedidos
  const m1Customer = orders?.find(o => o.id === m1.orderId)?.customer_id
  const m2Customer = orders?.find(o => o.id === m2.orderId)?.customer_id
  if (m1Customer === m2Customer) {
    passed.push("Maria tem o mesmo customer_id nos 2 pedidos")
  } else {
    failed.push("Maria tem customer_id DIFERENTE nos 2 pedidos")
  }

  // 3. Maria e José devem ter customer_id DIFERENTES
  const jCustomer = orders?.find(o => o.id === j1.orderId)?.customer_id
  if (m1Customer !== jCustomer) {
    passed.push("Maria e José tem customer_id DIFERENTES")
  } else {
    failed.push("Maria e José tem o MESMO customer_id")
  }

  // 4. Os clientes devem estar ativos
  const allAtivos = customers?.every(c => c.ativo === true)
  if (allAtivos) {
    passed.push("Todos os clientes estao ativos")
  } else {
    failed.push("Algum cliente esta inativo")
  }

  // 5. Maria não perdeu pedido para José
  const mariaOrders = orders?.filter(o => o.customer?.name === "Maria") || []
  if (mariaOrders.length === 2) {
    passed.push("Maria tem 2 pedidos, nenhum foi para José")
  } else {
    failed.push(`Maria tem ${mariaOrders.length} pedidos (esperado 2)`)
  }

  console.log("\nRESULTADO:")
  for (const p of passed) console.log(`   ✅ ${p}`)
  for (const f of failed) console.log(`   ❌ ${f}`)

  console.log(`\n${passed.length} aprovados, ${failed.length} falhas`)

  // Cleanup
  console.log("\n--- LIMPEZA ---")
  for (const phone of phones) {
    const { data: c } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      await sb.from("orders").delete().eq("customer_id", c.id)
      await sb.from("customers").delete().eq("id", c.id)
    }
  }
  console.log("OK")

  process.exitCode = failed.length > 0 ? 1 : 0
}

main().catch(err => {
  console.error("\nFATAL:", err)
  process.exit(1)
})
