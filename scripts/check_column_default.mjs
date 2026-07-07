/**
 * Check what `ativo` default value is in the customers table.
 * Also check what happens when inserting WITHOUT ativo.
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

async function run() {
  // 1. Insert a new customer WITHOUT setting ativo
  const TEST_PHONE = "719" + String(Date.now()).slice(-8)
  console.log("Inserindo cliente SEM ativo...")
  const { data: inserted, error: insErr } = await sb
    .from("customers")
    .insert({ name: "Teste Ativo Default", phone: TEST_PHONE })
    .select()
    .single()

  if (insErr) {
    console.error("Erro no insert:", insErr)
    process.exit(1)
  }

  console.log("Cliente inserido:", JSON.stringify(inserted, null, 2))
  console.log("\nValor de ativo:", inserted.ativo, "(tipo:", typeof inserted.ativo, ")")

  // 2. Query with ativo = true filter
  const { count: countAtivo } = await sb
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("id", inserted.id)
    .eq("ativo", true)

  console.log("\nQuery com ativo=true:", countAtivo, "resultados")

  // 3. Query without filter
  const { count: countAll } = await sb
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("id", inserted.id)

  console.log("Query sem filtro:", countAll, "resultados")

  // 4. Now insert WITH ativo = true
  const TEST_PHONE2 = "719" + String(Date.now() + 1).slice(-8)
  const { data: inserted2 } = await sb
    .from("customers")
    .insert({ name: "Teste Ativo True", phone: TEST_PHONE2, ativo: true })
    .select()
    .single()

  console.log("\nCliente COM ativo=true inserido:", inserted2?.id?.slice(0, 8), "ativo:", inserted2?.ativo)

  // Cleanup
  await sb.from("customers").delete().eq("id", inserted.id)
  await sb.from("customers").delete().eq("id", inserted2?.id)
  console.log("\nDados limpos.")
}

run().catch(console.error)
