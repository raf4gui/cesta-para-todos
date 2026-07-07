import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

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
    vars[key] = value
  }
  return vars
}

const env = loadEnv()
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  console.log("=".repeat(60))
  console.log("DIAGNÓSTICO DE INTEGRIDADE DO BANCO")
  console.log("=".repeat(60))

  // 1. Check for customers with empty/null phone
  const { data: emptyPhones } = await sb.from("customers").select("id, name, phone").or("phone.is.null,phone.eq.")
  console.log(`\n1. Clientes com telefone vazio/nulo: ${emptyPhones?.length || 0}`)
  if (emptyPhones?.length) {
    for (const c of emptyPhones) {
      console.log(`   [${c.id.slice(0,8)}] ${c.name} - phone: "${c.phone}"`)
    }
  }

  // 2. Check for duplicate phones
  const { data: allCustomers } = await sb.from("customers").select("id, name, phone").order("phone")
  const phoneCounts = {}
  for (const c of allCustomers || []) {
    phoneCounts[c.phone] = (phoneCounts[c.phone] || 0) + 1
  }
  const duplicates = Object.entries(phoneCounts).filter(([phone, count]) => count > 1)
  console.log(`\n2. Telefones duplicados: ${duplicates.length}`)
  for (const [phone, count] of duplicates) {
    const customers = (allCustomers || []).filter(c => c.phone === phone)
    console.log(`   Telefone: "${phone}" - ${count}x`)
    for (const c of customers) {
      console.log(`     [${c.id.slice(0,8)}] ${c.name}`)
    }
  }

  // 3. Test UNIQUE constraint by attempting duplicate insert
  const testPhone = "99999999999000"
  await sb.from("customers").delete().eq("phone", testPhone)
  await sb.from("customers").insert({ name: "DupTest1", phone: testPhone })
  const { error: dupError } = await sb.from("customers").insert({ name: "DupTest2", phone: testPhone }).select().single()
  console.log(`\n3. Teste UNIQUE constraint: ${dupError ? "EXISTE (erro: " + dupError.code + ")" : "NÃO EXISTE (inserção duplicada permitida!)"}`)
  await sb.from("customers").delete().eq("phone", testPhone)

  // 4. Check maybeSingle behavior with duplicates (if any exist)
  if (duplicates.length > 0) {
    const dupPhone = duplicates[0][0]
    console.log(`\n4. Teste maybeSingle com telefone duplicado "${dupPhone}":`)
    const { data: msData, error: msError } = await sb.from("customers").select("id, name").eq("phone", dupPhone).maybeSingle()
    console.log(`   maybeSingle data: ${msData ? JSON.stringify(msData) : "null"}`)
    console.log(`   maybeSingle error: ${msError?.message || "nenhum"}`)
  }

  // 5. Count total customers and orders
  const { count: customerCount } = await sb.from("customers").select("*", { count: "exact", head: true })
  const { count: orderCount } = await sb.from("orders").select("*", { count: "exact", head: true })
  console.log(`\n5. Total: ${customerCount} clientes, ${orderCount} pedidos`)

  console.log("\n" + "=".repeat(60))
}

check().catch(console.error)
