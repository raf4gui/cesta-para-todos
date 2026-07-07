/**
 * AUDITORIA FORENSE: Rastreia EXATAMENTE o que o submitOrder recebe.
 * 
 * Chama a Server Action via HTTP (igual ao navegador)
 * E chama o Supabase diretamente para ver o resultado.
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

// First: clean any test data from previous runs
async function cleanTestData() {
  const testPhones = ["11111111111", "22222222222", "33333333333", "44444444444", "55555555555"]
  for (const phone of testPhones) {
    const { data: c } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      await sb.from("order_items").delete().eq("order_id", c.id) // won't work but try
      await sb.from("orders").delete().eq("customer_id", c.id)
      await sb.from("customers").delete().eq("id", c.id)
    }
  }
}

async function main() {
  console.log("=".repeat(70))
  console.log("AUDITORIA FORENSE - RASTREANDO customer_id")
  console.log("=".repeat(70))
  
  await cleanTestData()
  console.log("\nDados de teste anteriores limpos.\n")
  
  // TEST 1: Check if ANY insert in DB results in different customer
  // We'll simulate EXACTLY what submitOrder does
  
  const testCases = [
    { name: "Maria", phone: "11111111111" },
    { name: "Fernando", phone: "22222222222" },
    { name: "Gabriel", phone: "33333333333" },
    { name: "Josefa", phone: "44444444444" },
    { name: "Joaquim", phone: "55555555555" },
  ]
  
  const results = []
  
  for (const tc of testCases) {
    console.log(`\n--- TEST: ${tc.name} (${tc.phone}) ---`)
    
    // STEP 1: What does the browser console show?
    // (We can't simulate the browser, but we CAN check the DB directly)
    
    // STEP 2: Normalize phone (same as submitOrder)
    const cleanedPhone = tc.phone.replace(/\D/g, "")
    console.log("PASSO 1-3: Telefone normalizado:", JSON.stringify(cleanedPhone))
    
    // STEP 3: Lookup (same as submitOrder)
    const { data: existing } = await sb.from("customers")
      .select("id, name, phone")
      .eq("phone", cleanedPhone)
      .limit(1)
      .maybeSingle()
    
    if (existing) {
      console.log(`PASSO 4-5: Cliente ENCONTRADO: ${existing.id.slice(0,8)} ${existing.name}`)
      console.log("  *** ISTO NAO DEVERIA ACONTECER ***")
      console.log("  O telefone", cleanedPhone, "JA EXISTE na tabela customers!")
    } else {
      console.log("PASSO 4-5: Cliente NAO encontrado (esperado)")
    }
    
    // STEP 4: Insert (same as submitOrder)
    console.log("PASSO 6-7: Inserindo customer...")
    const { data: customer, error: custErr } = await sb.from("customers")
      .insert({ name: tc.name, phone: cleanedPhone, ativo: true })
      .select()
      .single()
    
    if (custErr) {
      console.log(`  ERRO: ${custErr.message} (code: ${custErr.code})`)
      results.push({ ...tc, status: "ERROR", error: custErr.message })
      continue
    }
    
    console.log(`  Customer criado: ${customer.id} (${customer.name}, ${customer.phone})`)
    
    // STEP 5: Create order (same as submitOrder)
    console.log("PASSO 8-9: Criando pedido com customer_id:", customer.id)
    const { data: order, error: orderErr } = await sb.from("orders")
      .insert({
        customer_id: customer.id,
        basket_id: null,
        status: "AGUARDANDO_CONTATO",
        origin: "ONLINE",
      })
      .select()
      .single()
    
    if (orderErr) {
      console.log(`  ERRO no pedido: ${orderErr.message}`)
      results.push({ ...tc, status: "ORDER_ERROR", error: orderErr.message })
      continue
    }
    
    // STEP 6: Verify the order has the RIGHT customer_id
    console.log(`  Pedido criado: ${order.protocol}`)
    console.log(`  customer_id no pedido: ${order.customer_id}`)
    console.log(`  customer_id esperado:   ${customer.id}`)
    console.log(`  IGUAL? ${order.customer_id === customer.id ? "SIM ✅" : "NAO ❌"}`)
    
    results.push({
      ...tc,
      status: "OK",
      customerId: customer.id,
      customerIdShort: customer.id.slice(0,8),
      orderId: order.id,
      orderCustomerId: order.customer_id,
      match: order.customer_id === customer.id,
      protocol: order.protocol,
    })
  }
  
  // SUMMARY
  console.log("\n" + "=".repeat(70))
  console.log("RESUMO DA AUDITORIA")
  console.log("=".repeat(70))
  
  const customerIds = [...new Set(results.filter(r => r.status === "OK").map(r => r.customerId))]
  
  console.log(`Total de testes: ${results.length}`)
  console.log(`Clientes criados: ${results.filter(r => r.status === "OK").length}`)
  console.log(`IDs unicos de cliente: ${customerIds.length}`)
  
  if (customerIds.length === results.filter(r => r.status === "OK").length) {
    console.log("\n✅ CADA PEDIDO TEM SEU PROPRIO CLIENTE!")
  } else if (customerIds.length === 1) {
    console.log("\n❌❌❌ TODOS OS PEDIDOS TEM O MESMO CLIENTE!")
    console.log(`   ID unico: ${customerIds[0]}`)
  } else {
    console.log("\n⚠️  ALGUNS CLIENTES ESTAO SENDO REUTILIZADOS")
  }
  
  for (const r of results) {
    console.log(`  ${r.name.padEnd(12)} ${r.phone.padEnd(15)} -> ${r.status === "OK" ? r.customerIdShort + " " + r.protocol : "ERRO: " + r.error}`)
  }
  
  // CLEANUP
  console.log("\n--- LIMPEZA ---")
  await cleanTestData()
  console.log("OK")
}

main().catch(e => console.error("\nFATAL:", e)).finally(() => process.exit(0))
