/**
 * TESTE E2E: Simula o fluxo completo de submitOrder e verifica se o cliente
 * aparece na consulta que o admin usa.
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

async function main() {
  const phone = "719" + String(Date.now()).slice(-8)
  const name = "E2E Test User"

  console.log("=".repeat(70))
  console.log("TESTE E2E: submitOrder -> admin query")
  console.log("=".repeat(70))

  // STEP 1: Simula submitOrder (antes das minhas alteracoes)
  console.log("\n1. Simulando submitOrder ORIGINAL (sem .limit(1)):")

  let cleanedPhone
  try { cleanedPhone = normalizePhone(phone) } catch (e) { console.error("FALHA normalizePhone"); process.exit(1) }

  // Procura cliente (SEM .limit(1) - codigo ORIGINAL)
  const { data: existing, error: lookupErr } = await sb
    .from("customers")
    .select("id, name, phone")
    .eq("phone", cleanedPhone)
    .maybeSingle()

  console.log("   lookupErr:", lookupErr?.message || "nenhum")
  console.log("   existing:", existing ? `SIM (${existing.id.slice(0,8)})` : "NAO")

  if (existing) {
    console.log("   Cliente ja existe — usando existente")
  } else {
    console.log("   Cliente NAO existe — executando INSERT")
    const { data: customer, error: custErr } = await sb
      .from("customers")
      .insert({ name, phone: cleanedPhone })
      .select()
      .single()

    if (custErr) {
      console.log("   ERRO INSERT:", custErr.message, "code:", custErr.code)
      console.log("   DETALHES:", JSON.stringify(custErr))
    } else {
      console.log("   INSERT OK! customer:", JSON.stringify(customer))
    }
  }

  // STEP 2: Consulta IGUAL ao admin (listCustomers com ativo="true")
  console.log("\n2. Consulta IGUAL ao admin (listCustomers ativo=true):")
  const { data: adminResult, error: adminErr, count: adminCount } = await sb
    .from("customers")
    .select("*", { count: "exact" })
    .eq("ativo", true)
    .order("created_at", { ascending: false })
    .range(0, 19)

  if (adminErr) {
    console.log("   ERRO na consulta admin:", adminErr.message)
  } else {
    const found = adminResult?.filter(c => c.phone === cleanedPhone)
    console.log(`   Total clientes no admin: ${adminCount}`)
    console.log(`   Cliente de teste encontrado: ${found?.length > 0 ? "SIM" : "NAO"}`)
    if (found?.length > 0) {
      console.log(`   Nome: ${found[0].name} | Phone: ${found[0].phone} | Ativo: ${found[0].ativo}`)
    }
  }

  // STEP 3: Consulta SEM filtro (admin com "Todos")
  console.log("\n3. Consulta SEM filtro ativo (admin 'Todos'):")
  const { data: allResult, count: allCount } = await sb
    .from("customers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, 19)

  const foundAll = allResult?.filter(c => c.phone === cleanedPhone)
  console.log(`   Total clientes (todos): ${allCount}`)
  console.log(`   Cliente de teste encontrado: ${foundAll?.length > 0 ? "SIM" : "NAO"}`)

  // STEP 4: Limpeza
  console.log("\n4. Limpeza:")
  const { data: toClean } = await sb.from("customers").select("id").eq("phone", cleanedPhone).limit(1).maybeSingle()
  if (toClean) {
    await sb.from("orders").delete().eq("customer_id", toClean.id)
    await sb.from("customers").delete().eq("id", toClean.id)
    console.log("   Dados removidos")
  }

  console.log("\n" + "=".repeat(70))
  console.log("CONCLUIDO")
}

main().catch(console.error)
