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
  const testPhones = ["11111111111", "22222222222", "33333333333", "44444444444", "55555555555"]
  
  // Verify all customers exist
  const { data: customers } = await sb.from("customers").select("id, name, phone, ativo").in("phone", testPhones).order("created_at", { ascending: true })
  console.log("CLIENTES CRIADOS:", customers?.length || 0)
  for (const c of customers || []) {
    console.log(`  [${c.id.slice(0,8)}] ${c.name.padEnd(12)} ${c.phone} ativo:${c.ativo}`)
  }
  
  // Verify their orders
  for (const c of customers || []) {
    const { data: orders } = await sb.from("orders").select("id, protocol, customer_id").eq("customer_id", c.id)
    console.log(`  Pedidos de ${c.name}: ${orders?.length || 0} (${(orders || []).map(o => o.protocol).join(", ") || "nenhum"})`)
  }
  
  // Check customer_id isolation
  const customerIds = (customers || []).map(c => c.id)
  const uniqueIds = [...new Set(customerIds)]
  console.log(`\nIDs unicos: ${uniqueIds.length}/${testPhones.length}`)
  if (uniqueIds.length === testPhones.length) {
    console.log("✅ TODOS OS CLIENTES SAO INDEPENDENTES!")
  } else {
    console.log("❌ CLIENTES ESTAO SENDO REUTILIZADOS!")
  }
  
  // Check admin view (listCustomers equivalent)
  const { data: activeCustomers, count } = await sb.from("customers")
    .select("id, name, phone", { count: "exact" })
    .eq("ativo", true)
    .in("phone", testPhones)
  console.log(`\nClientes ativos: ${activeCustomers?.length || 0}`)
  console.log(`Total count: ${count}`)
  
  // Cleanup
  console.log("\n--- LIMPEZA ---")
  for (const phone of testPhones) {
    const { data: c } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      await sb.from("order_items").delete().eq("order_id", c.id)
      await sb.from("orders").delete().eq("customer_id", c.id)
      await sb.from("customers").delete().eq("id", c.id)
    }
  }
  console.log("OK")
}

main().catch(e => console.error("FATAL:", e))
