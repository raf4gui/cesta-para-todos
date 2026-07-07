/**
 * REPRODUZ EXATAMENTE o fluxo do submitOrder para Maria e José.
 * Usa o MESMO código lógico do actions.ts.
 * Descobre se o INSERT em customers realmente acontece.
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

async function run() {
  // Clean up any previous test data
  for (const phone of ["74999999999", "74888888888", "74777777777"]) {
    const { data: existing } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (existing) {
      await sb.from("orders").delete().eq("customer_id", existing.id)
      await sb.from("customers").delete().eq("id", existing.id)
    }
  }
  console.log("Dados anteriores limpos.\n")

  async function simulateSubmitOrder(clientName, clientPhone) {
    console.log("=".repeat(60))
    console.log(`SIMULANDO submitOrder para: ${clientName} / ${clientPhone}`)
    console.log("=".repeat(60))

    // PASSO 3 - Normalizar telefone
    const cleanedPhone = normalizePhone(clientPhone)
    console.log("PASSO 3 - Telefone normalizado:", cleanedPhone)

    // PASSO 4 - Procurar cliente
    const { data: existing, error: lookupErr } = await sb
      .from("customers")
      .select("id, name, phone")
      .eq("phone", cleanedPhone)
      .limit(1)
      .maybeSingle()

    console.log("PASSO 5 - Cliente encontrado?", existing ? `SIM (${existing.id.slice(0,8)} ${existing.name})` : "NAO")

    // VERIFICAÇÃO CRÍTICA: se existing existe mas id é undefined
    if (existing) {
      console.log("   existing.id:", JSON.stringify(existing.id))
      console.log("   existing.name:", JSON.stringify(existing.name))
      if (!existing.id) {
        console.log("   ⚠️ existing.id é UNDEFINED! Cliente existe mas sem ID!")
      }
    }

    let customerId
    if (lookupErr && !lookupErr.message?.includes("PGRST116")) {
      console.log("   ERRO na busca:", lookupErr.message)
      throw new Error("Erro ao buscar cliente")
    }

    if (existing) {
      customerId = existing.id
      console.log("   REUTILIZANDO cliente existente ID:", customerId)
    } else {
      console.log("PASSO 6 - Executando INSERT em customers...")
      console.log("   Dados: name=" + clientName + ", phone=" + cleanedPhone)
      
      const { data: customer, error: custErr } = await sb
        .from("customers")
        .insert({ name: clientName, phone: cleanedPhone })
        .select()
        .single()

      console.log("   customer retornado:", JSON.stringify(customer))
      console.log("   custErr:", custErr ? JSON.stringify(custErr) : "null")

      if (custErr) {
        if (custErr.message?.includes("unique") || custErr.code === "23505") {
          console.log("   UNIQUE violation, retry...")
          const { data: retry } = await sb
            .from("customers")
            .select("id")
            .eq("phone", cleanedPhone)
            .limit(1)
            .maybeSingle()
          if (retry) {
            customerId = retry.id
            console.log("   Retry OK, usando cliente ID:", customerId)
          } else {
            console.log("   Retry FALHOU!")
            throw new Error("Erro ao criar cliente")
          }
        } else {
          console.log("   ERRO nao recuperavel!")
          throw custErr
        }
      } else {
        customerId = customer.id
        console.log("PASSO 7 - INSERT realizado! customerId:", customerId)
      }
    }

    // VERIFICAÇÃO: customerId está definido?
    console.log("")
    console.log("🔍 VERIFICACAO CRITICA:")
    console.log("   customerId =", JSON.stringify(customerId))
    console.log("   type =", typeof customerId)
    console.log("   length =", customerId ? customerId.length : 0)
    console.log("   is UUID format:", customerId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId) : false)

    if (!customerId) {
      console.log("   ⚠️⚠️⚠️ CUSTOMERID É UNDEFINED! Pedido sera criado SEM customer_id!")
    }

    // PASSO 8 - Criar pedido
    console.log("\nPASSO 8 - Criando pedido com customerId:", customerId)
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

    if (orderErr) {
      console.log("   ERRO ao criar pedido:", orderErr.message)
      console.log("   Detalhes:", JSON.stringify(orderErr))
    } else {
      console.log("PASSO 9 - Pedido CRIADO!")
      console.log("   Order ID:", order.id)
      console.log("   customer_id no pedido:", order.customer_id)
      console.log("   customer_id === customerId?", order.customer_id === customerId)
    }

    console.log("")
    return { customerId, order }
  }

  // ========== TESTE MARIA ==========
  const result1 = await simulateSubmitOrder("Maria", "74999999999")
  console.log("\n>>> RESULTADO MARIA <<<")
  console.log("   customerId:", result1.customerId)
  console.log("   order customer_id:", result1.order?.customer_id)
  console.log("   IDs iguais?", result1.customerId === result1.order?.customer_id)

  // ========== TESTE JOSÉ ==========
  const result2 = await simulateSubmitOrder("José", "74888888888")
  console.log("\n>>> RESULTADO JOSÉ <<<")
  console.log("   customerId:", result2.customerId)
  console.log("   order customer_id:", result2.order?.customer_id)
  console.log("   IDs iguais?", result2.customerId === result2.order?.customer_id)

  // ========== VERIFICACAO FINAL ==========
  console.log("\n" + "=".repeat(60))
  console.log("VERIFICACAO FINAL")
  console.log("=".repeat(60))
  
  console.log("\nMaria e Jose usaram o MESMO customer_id?")
  console.log("   Maria customerId:", result1.customerId)
  console.log("   Jose customerId:", result2.customerId)
  if (result1.customerId === result2.customerId) {
    console.log("   ⚠️⚠️⚠️ SIM! MESMO ID! BUG CONFIRMADO!")
  } else {
    console.log("   ✅ DIFERENTES. OK")
  }

  console.log("\nClientes no banco:")
  const { data: allCustomers } = await sb.from("customers").select("id, name, phone").order("created_at", { ascending: false }).limit(10)
  for (const c of allCustomers || []) {
    console.log(`   [${c.id.slice(0,8)}] ${c.name} - ${c.phone}`)
  }

  // ========== TESTE CARLOS E MARIA NOVAMENTE ==========
  const result3 = await simulateSubmitOrder("Carlos", "74777777777")
  const result4 = await simulateSubmitOrder("Maria", "74999999999")

  console.log("\n" + "=".repeat(60))
  console.log("RESULTADO FINAL (4 pedidos)")
  console.log("=".repeat(60))

  // Check all orders
  const { data: allOrders } = await sb
    .from("orders")
    .select("id, customer_id, customer:customers!orders_customer_id_fkey(name, phone)")
    .order("created_at", { ascending: false })
    .limit(10)

  for (const o of allOrders || []) {
    console.log(`   Pedido ${o.id.slice(0,8)} -> customer: ${o.customer?.name || "SEM NOME"} (${o.customer?.phone || "SEM PHONE"})`)
  }

  // Check all customers
  console.log("\nTodos os customers:")
  const { data: finalCustomers } = await sb.from("customers").select("id, name, phone").order("created_at", { ascending: false }).limit(10)
  for (const c of finalCustomers || []) {
    console.log(`   [${c.id.slice(0,8)}] ${c.name} - ${c.phone}`)
  }

  // Cleanup
  console.log("\n--- LIMPEZA ---")
  for (const phone of ["74999999999", "74888888888", "74777777777"]) {
    const { data: c } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      await sb.from("orders").delete().eq("customer_id", c.id)
      await sb.from("customers").delete().eq("id", c.id)
    }
  }
  console.log("OK")
}

run().catch(err => {
  console.error("\nFATAL:", err)
  process.exit(1)
})
