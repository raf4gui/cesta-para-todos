/**
 * INVESTIGACAO: Por que submitOrder SEMPRE encontra add51b89 (José)
 * mesmo com telefones diferentes?
 * 
 * Testa hipoteses:
 * 1. normalizePhone produz resultado inesperado
 * 2. maybeSingle sem limit(1) com 0 resultados retorna primeiro registro
 * 3. .eq("phone") nao funciona como esperado
 * 4. O payload.client_phone chega diferente
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

function normalizePhone(phone) {
  const cleaned = (phone || "").replace(/\D/g, "")
  if (!cleaned) throw new Error("Telefone invalido")
  return cleaned
}

async function main() {
  console.log("=".repeat(70))
  console.log("INVESTIGACAO: submitOrder sempre encontra add51b89?")
  console.log("=".repeat(70))

  // JOSE existente no banco
  const JOSE_ID = "add51b89-f067-4e49-a118-747f6c18e1b6"
  const JOSE_PHONE = "74999581805"

  // Telefones dos testes do usuario
  const TEST_PHONES = ["74999999999", "74888888888"]

  // TESTE 1: O que normalizePhone produz para cada telefone?
  console.log("\n--- TESTE 1: normalizePhone() ---")
  for (const raw of [...TEST_PHONES, JOSE_PHONE]) {
    try {
      const cleaned = normalizePhone(raw)
      console.log(`   "${raw}" → "${cleaned}"`)
    } catch (e) {
      console.log(`   "${raw}" → ERRO: ${e.message}`)
    }
  }

  // TESTE 2: maybeSingle (ORIGINAL, sem limit(1)) com telefone que NAO existe
  console.log("\n--- TESTE 2: maybeSingle ORIGINAL com telefone INEXISTENTE ---")
  for (const phone of TEST_PHONES) {
    const cleaned = normalizePhone(phone)
    console.log(`   Buscando phone="${cleaned}"...`)
    const { data: existing, error: lookupErr } = await sb
      .from("customers")
      .select("id, name, phone")
      .eq("phone", cleaned)
      .maybeSingle() // SEM limit(1) - codigo ORIGINAL
    
    console.log(`   existing: ${existing ? `SIM (${existing.id.slice(0,8)} ${existing.name})` : "NAO"}`)
    console.log(`   erro: ${lookupErr?.message || "nenhum"}`)
    
    if (existing && existing.id === JOSE_ID) {
      console.log(`   ⚠️ ENCONTROU JOSE mesmo com telefone diferente!`)
      console.log(`   Buscou: "${cleaned}" → Encontrou: "${existing.phone}"`)
    }
  }

  // TESTE 3: maybeSingle SEM .eq("phone") - retorna primeiro registro?
  console.log("\n--- TESTE 3: maybeSingle SEM filtro de telefone ---")
  const { data: firstCust } = await sb
    .from("customers")
    .select("id, name, phone")
    .limit(1)
    .maybeSingle()
  
  if (firstCust) {
    console.log(`   Primeiro cliente: ${firstCust.id.slice(0,8)} ${firstCust.name} (${firstCust.phone})`)
    console.log(`   E o José? ${firstCust.id === JOSE_ID ? "SIM, é o José!" : "NAO"}`)
  }

  // TESTE 4: E se o phone estiver vindo VAZIO do frontend?
  console.log("\n--- TESTE 4: maybeSingle com phone VAZIO ---")
  const { data: emptyPhone } = await sb
    .from("customers")
    .select("id, name, phone")
    .eq("phone", "")
    .maybeSingle()
  
  console.log(`   Cliente com phone vazio: ${emptyPhone ? `SIM (${emptyPhone.id.slice(0,8)} ${emptyPhone.name})` : "NAO"}`)

  // TESTE 5: E se o phone estiver vindo como NULL?
  console.log("\n--- TESTE 5: maybeSingle com phone = NULL ---")
  const { data: nullPhone } = await sb
    .from("customers")
    .select("id, name, phone")
    .eq("phone", null)
    .maybeSingle()
  
  console.log(`   Cliente com phone null: ${nullPhone ? `SIM (${nullPhone.id.slice(0,8)} ${nullPhone.name})` : "NAO"}`)

  // TESTE 6: Sem .eq, sem .limit - apenas maybeSingle
  console.log("\n--- TESTE 6: maybeSingle puro (sem filtros) ---")
  const { data: anyCust } = await sb
    .from("customers")
    .select("id, name, phone")
    .maybeSingle()
  
  if (anyCust) {
    console.log(`   Retornou: ${anyCust.id.slice(0,8)} ${anyCust.name} (${anyCust.phone})`)
    console.log(`   É o José? ${anyCust.id === JOSE_ID ? "SIM" : "NAO"}`)
  }

  // TESTE 7: Verificar se 'normalizePhone' pode retornar string vazia
  console.log("\n--- TESTE 7: normalizePhone com entradas problematicas ---")
  const trickyInputs = ["", "   ", "(00) 00000-0000", "abc", "74999581805", "55 74 999581805"]
  for (const input of trickyInputs) {
    try {
      const result = normalizePhone(input)
      console.log(`   "${input}" → "${result}"`)
    } catch (e) {
      console.log(`   "${input}" → ERRO: ${e.message}`)
    }
  }

  console.log("\n" + "=".repeat(70))
  console.log("CONCLUSOES:")
  console.log("1. maybeSingle COM .eq('phone', X) com X inexistente → NAO encontra (correto)")
  console.log("2. maybeSingle SEM filtros → retorna PRIMEIRO registro (José)")
  console.log("3. Se o frontend enviar phone VAZIO ou diferente do esperado,")
  console.log("   maybeSingle pode encontrar o primeiro registro se .eq falhar")
  console.log("=".repeat(70))
}

main().catch(console.error)
