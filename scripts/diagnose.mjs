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
  // 1. Customers table columns
  const { data: cols } = await sb.from("information_schema.columns")
    .select("column_name, is_nullable, data_type, column_default")
    .eq("table_name", "customers")
    .eq("table_schema", "public")
  console.log("CUSTOMERS COLUMNS:")
  for (const c of cols || []) {
    console.log("  ", c.column_name, "|", c.data_type, "| nullable:", c.is_nullable, "| default:", c.column_default)
  }

  // 2. Constraints on customers
  const { data: cons } = await sb.from("information_schema.table_constraints")
    .select("constraint_name, constraint_type")
    .eq("table_name", "customers")
    .eq("table_schema", "public")
  console.log("\nCONSTRAINTS:")
  for (const c of cons || []) {
    console.log("  ", c.constraint_name, "-", c.constraint_type)
  }

  // 3. Check if UNIQUE constraint exists on phone
  const { data: uniqueCons } = await sb.from("information_schema.constraint_column_usage")
    .select("constraint_name, column_name")
    .eq("table_name", "customers")
    .eq("column_name", "phone")
    .eq("table_schema", "public")
  console.log("\nUNIQUE CONSTRAINT on phone:", uniqueCons?.length > 0 ? "EXISTS" : "NOT FOUND")

  // 4. List all customers
  const { data: all } = await sb.from("customers").select("id, name, phone, ativo, created_at").order("created_at", { ascending: false })
  console.log("\nALL CUSTOMERS (" + (all?.length || 0) + "):")
  for (const c of all || []) {
    console.log("  [" + c.id.slice(0,8) + "]", c.name, "-", c.phone, "- ativo:", c.ativo, "- criado:", c.created_at)
  }

  // 5. Test INSERT with unique phone
  const testPhone = "99999999111"
  console.log("\n--- TEST INSERT with phone", testPhone, "---")
  const { data: testCust, error: testErr } = await sb.from("customers")
    .insert({ name: "TESTE_DIAG", phone: testPhone, ativo: true })
    .select()
    .single()
  if (testErr) {
    console.log("INSERT ERROR:", testErr.message, "code:", testErr.code)
  } else {
    console.log("INSERTED:", testCust.id.slice(0,8), testCust.name, testCust.phone, "ativo:", testCust.ativo)
    const { error: delErr } = await sb.from("customers").delete().eq("id", testCust.id)
    if (delErr) console.log("CLEANUP ERROR:", delErr.message)
    else console.log("CLEANED UP")
  }

  // 6. Simulate EXACTLY what submitOrder does with Maria's phone
  const mariaPhone = "74999999999"
  console.log("\n--- SIMULATE submitOrder with", mariaPhone, "---")
  const cleanedPhone = mariaPhone.replace(/\D/g, "")
  console.log("cleanedPhone:", JSON.stringify(cleanedPhone))
  
  const { data: existing } = await sb.from("customers")
    .select("id, name, phone")
    .eq("phone", cleanedPhone)
    .limit(1)
    .maybeSingle()
  console.log("existing:", existing ? existing.id.slice(0,8) + " " + existing.name : "null")
  
  if (!existing) {
    console.log("INSERTING new customer...")
    const { data: customer, error: custErr } = await sb.from("customers")
      .insert({ name: "Maria", phone: cleanedPhone, ativo: true })
      .select()
      .single()
    if (custErr) {
      console.log("INSERT FAILED:", custErr.message, "code:", custErr.code)
    } else {
      console.log("INSERTED customer:", customer.id.slice(0,8), customer.name, customer.phone, "ativo:", customer.ativo)
      
      const { data: listCheck } = await sb.from("customers")
        .select("id, name, phone, ativo", { count: "exact" })
        .eq("ativo", true)
        .order("name")
      console.log("listCustomers (ativo=true):", listCheck?.length || 0)
      for (const c of listCheck || []) {
        console.log("  ", c.id.slice(0,8), c.name, c.phone, "ativo:", c.ativo)
      }
      
      await sb.from("customers").delete().eq("id", customer.id)
      console.log("CLEANED UP")
    }
  }
}

main().catch(e => console.error("FATAL:", e))
