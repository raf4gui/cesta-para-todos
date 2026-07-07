/**
 * TRACER: Testa submitOrder diretamente via Supabase para isolar o problema.
 * 
 * Simula EXATAMENTE o que submitOrder faz, passo a passo,
 * para descobrir onde o cadastro do cliente deixa de acontecer.
 */
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

function normalizePhone(phone) {
  const cleaned = (phone || "").replace(/\D/g, "")
  if (!cleaned) throw new Error("Telefone invalido apos limpeza.")
  return cleaned
}

async function trace() {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERRO: Variaveis de ambiente faltando")
    process.exit(1)
  }

  console.log("=".repeat(70))
  console.log("TRACER: submitOrder flow simulation")
  console.log("=".repeat(70))
  console.log("Supabase URL:", supabaseUrl)
  console.log("Service key presente:", !!serviceRoleKey)

  const sb = createClient(supabaseUrl, serviceRoleKey)

  // Test data
  const TEST_PHONE = "71988887777"
  const TEST_NAME = "Cliente Teste Tracer"
  const TIMESTAMP = Date.now()

  // Clean up any previous test data
  await sb.from("orders").delete().eq("customer_id", sb.from("customers").select("id").eq("phone", TEST_PHONE).limit(1))
  // Actually, let's just clean directly
  const { data: existingCust } = await sb.from("customers").select("id").eq("phone", TEST_PHONE).limit(1).maybeSingle()
  if (existingCust) {
    await sb.from("orders").delete().eq("customer_id", existingCust.id)
    await sb.from("customers").delete().eq("id", existingCust.id)
    console.log("\nLimpou dados anteriores do telefone", TEST_PHONE)
  }

  // Test with a unique phone to avoid interference
  const UNIQUE_PHONE = `719${String(TIMESTAMP).slice(-8)}`
  console.log("\nTelefone de teste unico:", UNIQUE_PHONE)

  // PASSO 1: Recebeu nome
  const inputName = "Maria Tracer"
  const inputPhone = UNIQUE_PHONE
  console.log("\n--- PASSO 1: Recebeu nome ---")
  console.log("nome:", inputName)

  // PASSO 2: Recebeu telefone
  console.log("\n--- PASSO 2: Recebeu telefone ---")
  console.log("telefone:", inputPhone)

  // PASSO 3: Telefone normalizado
  console.log("\n--- PASSO 3: Telefone normalizado ---")
  let cleanedPhone
  try {
    cleanedPhone = normalizePhone(inputPhone)
    console.log("telefone normalizado:", cleanedPhone)
    console.log("OK")
  } catch (e) {
    console.log("ERRO na normalizacao:", e.message)
    process.exit(1)
  }

  // PASSO 4: Cliente encontrado?
  console.log("\n--- PASSO 4: Cliente encontrado? ---")
  const { data: existing, error: lookupErr } = await sb
    .from("customers")
    .select("id, name, phone")
    .eq("phone", cleanedPhone)
    .limit(1)
    .maybeSingle()
  
  if (lookupErr) {
    console.log("ERRO na busca:", lookupErr.message)
    console.log("Tipo do erro:", lookupErr.code || "sem codigo")
  }
  if (existing) {
    console.log("SIM - id:", existing.id, "nome:", existing.name)
  } else {
    console.log("NAO - nenhum cliente encontrado")
  }

  // PASSO 5: Executando INSERT
  console.log("\n--- PASSO 5: Executando INSERT ---")
  if (!existing) {
    console.log("Motivo: cliente nao existe no banco")
    console.log("Dados a inserir: name=" + inputName + ", phone=" + cleanedPhone)
    
    const { data: customer, error: custErr } = await sb
      .from("customers")
      .insert({ name: inputName, phone: cleanedPhone })
      .select()
      .single()
    
    console.log("Resultado do INSERT:")
    if (custErr) {
      console.log("ERRO:", custErr.message, "code:", custErr.code)
      console.log("Detalhes:", JSON.stringify(custErr, null, 2))
    } else {
      console.log("SUCESSO! customer id:", customer.id)
      console.log("customer data:", JSON.stringify(customer))
    }
  } else {
    console.log("PULOU INSERT (cliente ja existia)")
  }

  // PASSO 6: INSERT realizado
  console.log("\n--- PASSO 6: INSERT realizado ---")
  const { data: verificar } = await sb.from("customers").select("id, name, phone").eq("phone", cleanedPhone).maybeSingle()
  if (verificar) {
    console.log("Cliente CONFIRMADO no banco: id=" + verificar.id + " name=" + verificar.name)
  } else {
    console.log("CLIENTE NAO ENCONTRADO no banco apos INSERT!")
    console.log("Isso indica que o INSERT falhou silenciosamente!")
  }

  // Cleanup
  console.log("\n--- LIMPEZA ---")
  const { data: custToClean } = await sb.from("customers").select("id").eq("phone", cleanedPhone).limit(1).maybeSingle()
  if (custToClean) {
    await sb.from("orders").delete().eq("customer_id", custToClean.id)
    await sb.from("customers").delete().eq("id", custToClean.id)
    console.log("Dados de teste removidos")
  }

  console.log("\n" + "=".repeat(70))
  console.log("TRACER CONCLUIDO")
  console.log("=".repeat(70))
}

trace().catch(err => {
  console.error("\nFATAL:", err)
  process.exit(1)
})
