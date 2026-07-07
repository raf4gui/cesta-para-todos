/**
 * Query information_schema to check customers table schema.
 * Uses the Supabase REST API with an internal function.
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
  // Query customers table schema using pg_catalog
  const { data, error } = await sb.rpc("get_schema_info")
  
  if (error) {
    console.log("RPC 'get_schema_info' not available, trying different approach...")
    
    // Try to query a single row and check its properties
    const { data: sample } = await sb
      .from("customers")
      .select("*")
      .limit(1)
    
    if (sample && sample.length > 0) {
      const row = sample[0]
      console.log("Sample customer row:")
      console.log(JSON.stringify(row, null, 2))
      console.log("\nColumns and their values:")
      for (const [key, value] of Object.entries(row)) {
        console.log(`  ${key}: ${value} (${typeof value})`)
      }
    } else {
      console.log("No rows found in customers table")
    }
    
    // Check what happens with a new insertion
    const TEST_PHONE = "719" + String(Date.now()).slice(-8)
    const { data: inserted, error: insErr } = await sb
      .from("customers")
      .insert({ name: "Schema Test", phone: TEST_PHONE })
      .select()
      .single()
    
    if (insErr) {
      console.log("\nINSERT error:", insErr)
    } else {
      console.log("\nNewly inserted customer:")
      console.log(JSON.stringify(inserted, null, 2))
      console.log("\nativo value:", JSON.stringify(inserted.ativo))
      console.log("ativo type:", typeof inserted.ativo)
      
      // Clean up
      await sb.from("customers").delete().eq("id", inserted.id)
      console.log("Cleaned up")
    }
  } else {
    console.log("Schema info:", data)
  }
}

run().catch(console.error)
