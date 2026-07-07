import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing env vars")
  process.exit(1)
}

const sb = createClient(url, key)
const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260711000000_add_personalization_order.sql"), "utf8")

const { error } = await sb.rpc("exec_sql", { query: sql })
if (error) {
  // Try raw query
  const { error: rawError } = await sb.from("_exec_sql").select("*").limit(0)
  if (rawError?.message?.includes("relation") || rawError?.message?.includes("does not exist")) {
    // No exec_sql function, use pg_query
    const { data, error: pgError } = await sb.rpc("pg_query", { query_text: sql })
    if (pgError) {
      console.error("Migration error:", pgError)
      process.exit(1)
    }
    console.log("Migration applied via pg_query:", data)
  } else {
    console.error("Migration error:", error)
    process.exit(1)
  }
} else {
  console.log("Migration applied successfully")
}

// Refresh schema cache
await sb.rpc("pg_query", { query_text: "NOTIFY pgrst, 'reload schema';" })
console.log("Schema cache refreshed")
