/**
 * VERIFICA O ESQUEMA REAL DAS TABELAS orders e customers.
 * Query direta via Supabase REST API.
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

const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log("=".repeat(70))
  console.log("VERIFICACAO DO ESQUEMA REAL DAS TABELAS")
  console.log("=".repeat(70))

  // 1. Pega 1 registro de orders para ver as colunas
  console.log("\n--- ORDERS: 1 registro qualquer ---")
  const { data: sampleOrder, error: orderErr } = await sb
    .from("orders")
    .select("*")
    .limit(1)

  if (orderErr) {
    console.log("ERRO ao ler orders:", orderErr.message)
  } else if (sampleOrder && sampleOrder.length > 0) {
    const row = sampleOrder[0]
    console.log("Colunas da tabela orders:")
    for (const [key, value] of Object.entries(row)) {
      console.log(`   ${key}: ${JSON.stringify(value)} (${typeof value})`)
    }
  } else {
    console.log("Nenhum registro em orders (ou erro)")
  }

  // 2. Pega os ULTIMOS 5 pedidos para ver TODOS os campos
  console.log("\n--- ORDERS: ultimos 5 pedidos ---")
  const { data: recentOrders } = await sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  if (recentOrders) {
    for (const o of recentOrders) {
      console.log(`\nPedido ${o.protocol || o.id?.slice(0,8)}:`)
      console.log(`   id: ${o.id}`)
      console.log(`   customer_id: ${JSON.stringify(o.customer_id)}`)
      console.log(`   status: ${o.status}`)
      console.log(`   origin: ${o.origin}`)
      // Check ALL fields that might contain customer data
      const customerFields = ['customer_name', 'customer_phone', 'name', 'phone', 'client_name', 'client_phone']
      for (const field of customerFields) {
        if (field in o) {
          console.log(`   ${field}: ${JSON.stringify(o[field])}`)
        }
      }
    }
  }

  // 3. Verifica customers
  console.log("\n\n--- CUSTOMERS: total de registros ---")
  const { count: custCount, error: custErr } = await sb
    .from("customers")
    .select("*", { count: "exact", head: true })

  if (custErr) {
    console.log("ERRO ao contar customers:", custErr.message)
  } else {
    console.log(`Total de clientes: ${custCount}`)
  }

  // 4. Tenta pegar 1 customer para ver colunas
  console.log("\n--- CUSTOMERS: schema via amostra ---")
  const { data: sampleCust } = await sb
    .from("customers")
    .select("*")
    .limit(1)

  if (sampleCust && sampleCust.length > 0) {
    const row = sampleCust[0]
    console.log("Colunas da tabela customers:")
    for (const [key, value] of Object.entries(row)) {
      console.log(`   ${key}: ${JSON.stringify(value)} (${typeof value})`)
    }
  } else {
    console.log("Nenhum registro em customers. Tentando INSERT temporario...")
    // Insert a temp customer to see the schema
    const phone = "719" + String(Date.now()).slice(-8)
    const { data: newCust, error: insErr } = await sb
      .from("customers")
      .insert({ name: "Schema Check", phone })
      .select()
      .single()
    
    if (insErr) {
      console.log("ERRO ao inserir customer de teste:", insErr.message)
      console.log("Detalhes:", JSON.stringify(insErr))
    } else {
      console.log("Novo customer inserido com colunas:")
      for (const [key, value] of Object.entries(newCust)) {
        console.log(`   ${key}: ${JSON.stringify(value)} (${typeof value})`)
      }
      // Clean up
      await sb.from("customers").delete().eq("id", newCust.id)
      console.log("Registro de teste removido.")
    }
  }

  // 5. VERIFICACAO CRUCIAL: testar se customer_id undefined cria pedido
  console.log("\n\n--- TESTE: inserir pedido com customer_id = undefined ---")
  const testPhone = "719" + String(Date.now() + 1).slice(-8)
  // First create a real customer
  const { data: realCust } = await sb
    .from("customers")
    .insert({ name: "Test Reference", phone: testPhone })
    .select()
    .single()
  console.log("Cliente de referencia criado:", realCust?.id)
  
  // Test 1: Insert order WITHOUT customer_id (simulating what happens if customerId is undefined)
  const { data: orderNoCust, error: errNoCust } = await sb
    .from("orders")
    .insert({
      basket_id: null,
      status: "AGUARDANDO_CONTATO",
      origin: "ONLINE",
    })
    .select()
    .single()
  
  console.log("\nTeste 1 - Pedido SEM customer_id:")
  if (errNoCust) {
    console.log("   ERRO (esperado se NOT NULL):", errNoCust.message)
    console.log("   Detalhes:", JSON.stringify(errNoCust))
  } else {
    console.log("   PEDIDO CRIADO SEM CUSTOMER_ID!")
    console.log("   Order:", JSON.stringify(orderNoCust))
  }

  // Test 2: Insert order WITH valid customer_id
  const { data: orderWithCust, error: errWithCust } = await sb
    .from("orders")
    .insert({
      customer_id: realCust.id,
      basket_id: null,
      status: "AGUARDANDO_CONTATO",
      origin: "ONLINE",
    })
    .select()
    .single()
  
  console.log("\nTeste 2 - Pedido COM customer_id valido:")
  if (errWithCust) {
    console.log("   ERRO:", errWithCust.message)
  } else {
    console.log("   PEDIDO CRIADO COM CUSTOMER_ID!")
    console.log("   Order:", JSON.stringify(orderWithCust))
  }

  // Test 3: Insert order with INVALID customer_id (non-existent UUID)
  const fakeUuid = "00000000-0000-0000-0000-000000000000"
  const { data: orderFakeCust, error: errFakeCust } = await sb
    .from("orders")
    .insert({
      customer_id: fakeUuid,
      basket_id: null,
      status: "AGUARDANDO_CONTATO",
      origin: "ONLINE",
    })
    .select()
    .single()
  
  console.log("\nTeste 3 - Pedido COM customer_id INEXISTENTE (00000000-0000-0000-0000-000000000000):")
  if (errFakeCust) {
    console.log("   ERRO (esperado se FK existe):", errFakeCust.message)
    console.log("   Detalhes:", JSON.stringify(errFakeCust))
  } else {
    console.log("   PEDIDO CRIADO COM CUSTOMER_ID INEXISTENTE!")
    console.log("   Order:", JSON.stringify(orderFakeCust))
  }

  // Cleanup test data
  console.log("\n--- LIMPEZA ---")
  if (orderNoCust) await sb.from("orders").delete().eq("id", orderNoCust.id)
  if (orderWithCust) await sb.from("orders").delete().eq("id", orderWithCust.id)
  if (orderFakeCust) await sb.from("orders").delete().eq("id", orderFakeCust?.id)
  if (realCust) {
    await sb.from("orders").delete().eq("customer_id", realCust.id)
    await sb.from("customers").delete().eq("id", realCust.id)
  }
  console.log("OK")

  console.log("\n" + "=".repeat(70))
  console.log("VERIFICACAO CONCLUIDA")
}

main().catch(console.error)
