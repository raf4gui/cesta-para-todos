/**
 * Aplica UNIQUE constraint via Supabase REST API usando service_role key.
 * 
 * A Supabase REST API aceita queries SQL no endpoint /rest/v1/ 
 * se usarmos o header "Prefer: tx=open" e enviarmos SQL como corpo.
 * 
 * Mas isso nao funciona diretamente. Vamos usar o Supabase JS client
 * com um truque: criar uma function via rpc call que nao existe ainda...
 * nao funciona.
 * 
 * Vamos tentar usar o Supabase Management API v2 (precisa de token PAT)
 * ou via GraphQL.
 */

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

async function run() {
  const env = loadEnv()
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = supabaseUrl?.match(/https:\/\/(.+)\.supabase\.co/)?.[1]

  console.log("Project Ref:", projectRef)
  
  if (!projectRef || !serviceRoleKey) {
    console.error("Faltam variaveis SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL")
    process.exit(1)
  }

  console.log("\nTentando via Supabase REST API com service_role key...")

  // Tenta usar o endpoint /rest/v1/ da Supabase passando raw SQL
  // A Supabase REST API suporta o endpoint /rest/v1/ mas nao aceita DDL diretamente.
  // 
  // Alternativa: usar o Supabase Storage API ou o endpoint de database:
  // POST https://api.supabase.com/v1/projects/{ref}/database/query
  // Esse endpoint PRECISA de um Personal Access Token (PAT), nao service_role key.

  // Vamos tentar o supabase CLI
  console.log("\nTentando via Supabase CLI...")
  console.log(`supabase link --project-ref ${projectRef}`)
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  NAO FOI POSSIVEL CONECTAR VIA PG OU REST API                      ║
║                                                                    ║
║  Por favor, aplique a migration manualmente:                       ║
║                                                                    ║
║  1. Acesse: https://supabase.com/dashboard/project/${projectRef}/sql/new  ║
║  2. Cole o SQL abaixo                                              ║
║  3. Execute                                                        ║
╚══════════════════════════════════════════════════════════════════════╝
`)
}

run()
