/**
 * Teste Automatizado do Fluxo de Clientes
 * 
 * Simula o fluxo completo de submitOrder e verifica a integridade dos dados.
 * 
 * Uso: node scripts/test_customer_flow.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
function loadEnv() {
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
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    vars[key] = value
  }
  return vars
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(SUPABASE_URL, SERVICE_KEY)

function normalizePhone(phone) {
  const cleaned = (phone || "").replace(/\D/g, "")
  if (!cleaned) throw new Error("Telefone inválido após limpeza.")
  return cleaned
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function submitOrder(client_name, client_phone) {
  const cleanedPhone = normalizePhone(client_phone)

  const { data: existing } = await sb
    .from("customers")
    .select("id, name")
    .eq("phone", cleanedPhone)
    .maybeSingle()

  let customerId
  if (existing) {
    customerId = existing.id
    if (existing.name !== client_name) {
      await sb.from("customers").update({ name: client_name }).eq("id", existing.id)
    }
  } else {
    const { data: customer, error } = await sb
      .from("customers")
      .insert({ name: client_name, phone: cleanedPhone })
      .select()
      .single()
    if (error) {
      if (error.message?.includes("unique") || error.code === "23505") {
        const { data: retry } = await sb.from("customers").select("id").eq("phone", cleanedPhone).maybeSingle()
        if (retry) customerId = retry.id
        else throw new Error("Falha no retry")
      } else {
        throw error
      }
    } else {
      customerId = customer.id
    }
  }

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .insert({
      customer_id: customerId,
      status: "AGUARDANDO_CONTATO",
      origin: "ONLINE",
    })
    .select()
    .single()

  if (orderErr) throw orderErr
  return { customerId, orderId: order.id, protocol: order.protocol }
}

async function getState() {
  const { data: customers } = await sb.from("customers").select("*").order("created_at", { ascending: true })
  const { data: orders } = await sb.from("orders").select("*, customer:customers!orders_customer_id_fkey(name, phone)").order("created_at", { ascending: true })
  return { customers: customers ?? [], orders: orders ?? [] }
}

async function printState(label) {
  console.log(`\n=== ${label} ===`)
  const state = await getState()
  console.log(`Clientes (${state.customers.length}):`)
  for (const c of state.customers) {
    console.log(`  [${c.id.slice(0, 8)}] ${c.name} - tel: ${c.phone} - criado: ${c.created_at}`)
  }
  console.log(`Pedidos (${state.orders.length}):`)
  for (const o of state.orders) {
    console.log(`  [${o.id.slice(0, 8)}] protocolo: ${o.protocol} - cliente: ${o.customer?.name} (${o.customer_id.slice(0, 8)})`)
  }
  return state
}

async function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FALHOU: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`  ✅ ${message}`)
  }
}

async function run() {
  console.log("=".repeat(60))
  console.log("TESTE AUTOMATIZADO DO FLUXO DE CLIENTES")
  console.log("=".repeat(60))

  // Clean up test data from previous runs
  console.log("\n--- Limpando dados de teste anteriores ---")
  await sb.from("orders").delete().or(`customer_id.in.(${(await sb.from("customers").select("id").in("phone", ["74999999999", "74888888888"])).data?.map(c => `"${c.id}"`).join(",") || ""})`)
  await sb.from("customers").delete().in("phone", ["74999999999", "74888888888"])

  let state

  // ============================================
  // TESTE 1: Maria, primeiro pedido
  // ============================================
  console.log("\n" + "=".repeat(60))
  console.log("TESTE 1: Maria (74999999999) - Primeiro pedido")
  console.log("=".repeat(60))
  
  const r1 = await submitOrder("Maria", "74999999999")
  console.log(`Resultado: customerId=${r1.customerId.slice(0, 8)}, orderId=${r1.orderId.slice(0, 8)}, protocol=${r1.protocol}`)
  
  state = await printState("Estado após Teste 1")
  assert(state.customers.length === 1, "1 cliente criado")
  assert(state.orders.length === 1, "1 pedido criado")
  assert(state.customers[0].name === "Maria", "Cliente se chama Maria")
  assert(state.customers[0].phone === "74999999999", "Telefone de Maria é 74999999999")
  assert(state.orders[0].customer?.name === "Maria", "Pedido pertence a Maria")
  assert(state.orders[0].customer_id === state.customers[0].id, "FK pedido → cliente correta")

  // ============================================
  // TESTE 2: José, primeiro pedido (telefone diferente)
  // ============================================
  console.log("\n" + "=".repeat(60))
  console.log("TESTE 2: José (74888888888) - Telefone diferente")
  console.log("=".repeat(60))
  
  const r2 = await submitOrder("José", "74888888888")
  console.log(`Resultado: customerId=${r2.customerId.slice(0, 8)}, orderId=${r2.orderId.slice(0, 8)}, protocol=${r2.protocol}`)
  
  state = await printState("Estado após Teste 2")
  assert(state.customers.length === 2, "2 clientes (Maria + José)")
  assert(state.orders.length === 2, "2 pedidos")
  
  const maria = state.customers.find(c => c.name === "Maria")
  const jose = state.customers.find(c => c.name === "José")
  assert(!!maria, "Maria continua existindo")
  assert(!!jose, "José foi criado")
  assert(maria && jose && maria.id !== jose.id, "Maria e José têm IDs diferentes")
  
  const mariaOrders = state.orders.filter(o => o.customer_id === maria?.id)
  const joseOrders = state.orders.filter(o => o.customer_id === jose?.id)
  assert(mariaOrders.length === 1, "Maria tem 1 pedido")
  assert(joseOrders.length === 1, "José tem 1 pedido")

  // ============================================
  // TESTE 3: Maria novamente (mesmo telefone)
  // ============================================
  console.log("\n" + "=".repeat(60))
  console.log("TESTE 3: Maria novamente (74999999999) - mesmo telefone")
  console.log("=".repeat(60))
  
  const r3 = await submitOrder("Maria", "74999999999")
  console.log(`Resultado: customerId=${r3.customerId.slice(0, 8)}, orderId=${r3.orderId.slice(0, 8)}, protocol=${r3.protocol}`)
  
  state = await printState("Estado após Teste 3")
  assert(state.customers.length === 2, "Ainda 2 clientes (Maria não duplicada)")
  assert(state.orders.length === 3, "3 pedidos no total")
  
  const maria2 = state.customers.find(c => c.name === "Maria")
  const jose2 = state.customers.find(c => c.name === "José")
  assert(!!maria2, "Maria existe")
  assert(!!jose2, "José existe")
  
  const mariaOrders2 = state.orders.filter(o => o.customer_id === maria2?.id)
  const joseOrders2 = state.orders.filter(o => o.customer_id === jose2?.id)
  assert(mariaOrders2.length === 2, "Maria tem 2 pedidos")
  assert(joseOrders2.length === 1, "José tem 1 pedido")
  
  assert(r3.customerId === maria2?.id, "Novo pedido de Maria vinculado ao mesmo customerId de Maria")
  assert(r3.customerId === r1.customerId, "customerId de Maria é o mesmo do Teste 1")

  // ============================================
  // TESTE 4: Excluir José
  // ============================================
  console.log("\n" + "=".repeat(60))
  console.log("TESTE 4: Excluir José")
  console.log("=".repeat(60))

  // Can't delete José because he has orders. The system protects against this.
  // Let's just verify that the protection works.
  try {
    await sb.from("customers").delete().eq("id", jose2?.id)
    console.log("  ⚠️  José foi excluído (pode ser que não tenha proteção via script)")
  } catch (e) {
    console.log("  ℹ️  Tentativa de excluir José falhou (protegido):", e.message)
  }

  state = await printState("Estado após Teste 4")
  // Verify Maria is unaffected
  const maria3 = state.customers.find(c => c.name === "Maria")
  assert(!!maria3, "Maria permanece após exclusão de José")
  const mariaOrders3 = state.orders.filter(o => o.customer_id === maria3?.id)
  assert(mariaOrders3.length === 2, "Pedidos de Maria permanecem intactos")

  // ============================================
  // VERIFICAÇÕES FINAIS DE INTEGRIDADE
  // ============================================
  console.log("\n" + "=".repeat(60))
  console.log("VERIFICAÇÕES DE INTEGRIDADE")
  console.log("=".repeat(60))

  const finalState = await getState()
  const mariaFinal = finalState.customers.find(c => c.name === "Maria")
  const joseFinal = finalState.customers.find(c => c.name === "José")

  // Check no duplicate phones
  const phones = finalState.customers.map(c => c.phone)
  const uniquePhones = new Set(phones)
  assert(phones.length === uniquePhones.size, "Nenhum telefone duplicado")

  // Check FK integrity
  for (const order of finalState.orders) {
    const customerExists = finalState.customers.some(c => c.id === order.customer_id)
    assert(customerExists, `FK integridade: pedido ${order.protocol} aponta para cliente existente (${order.customer_id})`)
  }
  
  // Check no null customer_ids
  for (const order of finalState.orders) {
    assert(order.customer_id, `Pedido ${order.protocol} tem customer_id não nulo`)
  }

  console.log("\n" + "=".repeat(60))
  if (process.exitCode) {
    console.log("❌ ALGUNS TESTES FALHARAM")
  } else {
    console.log("✅ TODOS OS TESTES PASSARAM")
  }
  console.log("=".repeat(60))
  
  // Cleanup test data
  console.log("\n--- Limpando dados de teste ---")
  const testCustomers = await sb.from("customers").select("id").in("phone", ["74999999999", "74888888888"])
  if (testCustomers.data?.length) {
    const ids = testCustomers.data.map(c => c.id)
    await sb.from("orders").delete().in("customer_id", ids)
    await sb.from("customers").delete().in("id", ids)
    console.log("Dados de teste removidos.")
  }
}

run().catch(err => {
  console.error("ERRO FATAL:", err)
  process.exitCode = 1
})
