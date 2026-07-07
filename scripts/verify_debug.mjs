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
  // Check the customers that were just created via the API debug route
  const testPhones = ["11111111111", "22222222222"]
  
  for (const phone of testPhones) {
    const { data: c } = await sb.from("customers").select("id, name, phone, ativo").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      console.log(`Phone ${phone}: [${c.id.slice(0,8)}] ${c.name} ativo:${c.ativo}`)
    } else {
      console.log(`Phone ${phone}: NOT FOUND`)
    }
  }
  
  // Clean up
  for (const phone of testPhones) {
    const { data: c } = await sb.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle()
    if (c) {
      await sb.from("orders").delete().eq("customer_id", c.id)
      await sb.from("customers").delete().eq("id", c.id)
      console.log(`Cleaned up ${phone}`)
    }
  }
}

main().catch(e => console.error("FATAL:", e))
