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
  console.log("========================================")
  console.log("AUDITORIA: TODOS OS PEDIDOS")
  console.log("========================================")
  
  const { data: orders, error: ordersErr } = await sb
    .from("orders")
    .select("id, protocol, customer_id, created_at")
    .order("created_at", { ascending: false })
    .limit(10)
  
  if (ordersErr) { console.error("ERRO orders:", ordersErr); return }
  
  console.log(`\nÚLTIMOS ${orders.length} PEDIDOS:`)
  console.log("protocol".padEnd(12), "customer_id".padEnd(30), "created_at")
  console.log("-".repeat(60))
  for (const o of orders) {
    console.log((o.protocol || "").padEnd(12), (o.customer_id || "").slice(0, 26).padEnd(30), o.created_at)
  }
  
  // Check if all customer_ids are the same
  const uniqueIds = [...new Set(orders.map(o => o.customer_id))]
  console.log(`\nIDs de cliente únicos: ${uniqueIds.length}`)
  if (uniqueIds.length === 1) {
    console.log("❌ CONFIRMADO: TODOS OS PEDIDOS TÊM O MESMO customer_id:", uniqueIds[0])
  } else {
    console.log("✅ Pedidos têm customer_ids DIFERENTES")
  }
  
  console.log("\n========================================")
  console.log("AUDITORIA: TODOS OS CLIENTES")
  console.log("========================================")
  
  const { data: customers, error: custErr } = await sb
    .from("customers")
    .select("id, name, phone, ativo")
    .order("created_at", { ascending: false })
  
  if (custErr) { console.error("ERRO customers:", custErr); return }
  
  console.log(`\nTOTAL DE CLIENTES: ${customers.length}`)
  console.log("id".padEnd(28), "name".padEnd(20), "phone".padEnd(16), "ativo")
  console.log("-".repeat(75))
  for (const c of customers) {
    console.log(c.id.slice(0, 26).padEnd(28), (c.name || "").padEnd(20), (c.phone || "").padEnd(16), c.ativo)
  }
  
  console.log("\n========================================")
  console.log("CRUZAMENTO: orders.customer_id vs customers.id")
  console.log("========================================")
  
  for (const o of orders) {
    const { data: c } = await sb.from("customers").select("name, phone").eq("id", o.customer_id).single()
    if (c) {
      console.log(`${o.protocol.padEnd(12)} → customer_id: ${o.customer_id.slice(0, 26)} → ${c.name} (${c.phone})`)
    } else {
      console.log(`${o.protocol.padEnd(12)} → customer_id: ${o.customer_id.slice(0, 26)} → CLIENTE NÃO ENCONTRADO!`)
    }
  }
}

main().catch(e => console.error("FATAL:", e))
