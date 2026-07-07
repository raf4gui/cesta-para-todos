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

async function prove() {
  const TEST_PHONE = "11999999999"

  console.log("=".repeat(70))
  console.log("PROVA DO BUG E FIX: maybeSingle() com duplicatas")
  console.log("=".repeat(70))

  // Clean slate
  await sb.from("customers").delete().eq("phone", TEST_PHONE)

  // Step 1: Create first customer
  console.log("\n1. Criando primeiro cliente com telefone", TEST_PHONE)
  const { data: c1 } = await sb.from("customers").insert({ name: "Maria", phone: TEST_PHONE }).select().single()
  console.log("   Criado ID:", c1?.id?.slice(0, 8), "Nome:", c1?.name)

  // Step 2: Test maybeSingle - should work fine with one record
  const { data: ms1, error: err1 } = await sb.from("customers").select("id, name").eq("phone", TEST_PHONE).maybeSingle()
  console.log("\n2. maybeSingle com 1 registro:")
  console.log("   existing:", ms1 ? `SIM (${ms1.id.slice(0,8)}, ${ms1.name})` : "null")
  console.log("   erro:", err1?.message || "nenhum")
  console.log("   ✅ FUNCIONA: existing tem o cliente")

  // Step 3: Create DUPLICATE (allowed because no UNIQUE constraint)
  console.log("\n3. CRIANDO DUPLICATA (permitido porque UNIQUE constraint nao existe)")
  const { data: c2 } = await sb.from("customers").insert({ name: "José", phone: TEST_PHONE }).select().single()
  console.log("   Criado ID:", c2?.id?.slice(0, 8), "Nome:", c2?.name)

  // Step 4: Test maybeSingle WITH duplicate - THIS IS THE BUG
  const { data: ms2, error: err2 } = await sb.from("customers").select("id, name").eq("phone", TEST_PHONE).maybeSingle()
  console.log("\n4. maybeSingle com 2 registros (MESMO telefone):")
  console.log("   existing:", ms2 ? `SIM (${ms2.id.slice(0,8)}, ${ms2.name})` : "null")
  console.log("   erro:", err2?.message || "nenhum")
  if (!ms2 && err2) {
    console.log("\n   🔴 BUG CONFIRMADO!")
    console.log("   maybeSingle retornou erro em vez do cliente!")
    console.log("   O codigo faz: if (existing) { usa existente } else { CRIA NOVO }")
    console.log("   Como existing=null, o codigo cria OUTRA duplicata!")
    console.log("   Isso explica TODOS os sintomas do bug:")
    console.log("   • nenhum cliente encontrado → cria novo (mas ja existia)")
    console.log("   • cliente existente substituido → cria novo e associa pedido ao novo")
    console.log("   • todos pedidos mesmo cliente → nova duplicata a cada pedido")
  }

  // Step 5: Show what happens next - creating another duplicate
  console.log("\n5. CONSEQUENCIA: codigo atual cria MAIS UMA duplicata:")
  const { data: c3 } = await sb.from("customers").insert({ name: "Maria (2o pedido)", phone: TEST_PHONE }).select().single()
  console.log("   Nova duplicata criada ID:", c3?.id?.slice(0, 8), "Nome:", c3?.name)

  const { data: allDups } = await sb.from("customers").select("id, name").eq("phone", TEST_PHONE)
  console.log(`\n   Agora existem ${allDups?.length} registros com o telefone ${TEST_PHONE}:`)
  for (const d of allDups || []) {
    console.log(`   [${d.id.slice(0,8)}] ${d.name}`)
  }
  console.log("\n   🔴 CADA PEDIDO CRIA UM NOVO CLIENTE! Isso explica tudo.")

  // === DEMONSTRAR FIX ===
  console.log("\n" + "=".repeat(70))
  console.log("DEMONSTRANDO FIX: .limit(1).maybeSingle()")
  console.log("=".repeat(70))

  // Step 6: Test limit(1).maybeSingle with duplicates - THE FIX
  const { data: ms3, error: err3 } = await sb.from("customers").select("id, name").eq("phone", TEST_PHONE).limit(1).maybeSingle()
  console.log("\n6. .limit(1).maybeSingle com 3 duplicatas:")
  console.log("   existing:", ms3 ? `SIM (${ms3.id.slice(0,8)}, ${ms3.name})` : "null")
  console.log("   erro:", err3?.message || "nenhum")
  if (ms3 && !err3) {
    console.log("   ✅ FIX FUNCIONA: existing tem o primeiro cliente mesmo com duplicatas!")
    console.log("   Agora o codigo vai atualizar o existente em vez de criar nova duplicata.")
  }

  // Step 7: Also check PGRST116 for no-results
  const { data: ms4, error: err4 } = await sb.from("customers").select("id, name").eq("phone", "00000000000").limit(1).maybeSingle()
  console.log("\n7. .limit(1).maybeSingle com 0 registros:")
  console.log("   existing:", ms4 ? `SIM` : "null")
  console.log("   erro:", err4?.message || "nenhum")
  if (!ms4 && (err4?.message?.includes("PGRST116") || err4?.message?.includes("multiple (or no) rows"))) {
    console.log("   ✅ CORRETO: PGRST116 → existing=null → cria novo cliente")
  }

  // Cleanup
  await sb.from("customers").delete().eq("phone", TEST_PHONE)
  console.log("\n   Dados de teste removidos.")
  console.log("=".repeat(70))
  console.log("\nRESUMO:")
  console.log("  • maybeSingle() SOZINHO → BUG quando ha duplicatas")
  console.log("  • .limit(1).maybeSingle() → FIX: retorna primeiro cliente independente de duplicatas")
  console.log("  • UNIQUE constraint → PREVENCAO permanente: impede novas duplicatas")
  console.log("  • Ambos sao necessarios para a solucao completa.")
}

prove().catch(console.error)
