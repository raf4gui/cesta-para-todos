import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import dns from "dns"
import pg from "pg"

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

function parseDbUrl(url) {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (!match) throw new Error("Invalid DATABASE_URL")
  return { user: match[1], password: decodeURIComponent(match[2]), host: match[3], port: parseInt(match[4]), database: match[5] }
}

async function run() {
  const env = loadEnv()
  const rawUrl = env.DATABASE_URL
  if (!rawUrl) { console.error("DATABASE_URL nao encontrada"); process.exit(1) }

  const parsed = parseDbUrl(rawUrl)

  // Manually resolve hostname to IPv6 (host is IPv6-only)
  let hostAddress
  try {
    const addrs = await dns.promises.resolve6(parsed.host)
    hostAddress = addrs[0]
  } catch {
    const addrs = await dns.promises.resolve4(parsed.host)
    hostAddress = addrs[0]
  }
  console.log(`Resolved ${parsed.host} -> ${hostAddress}`)

  const pool = new pg.Pool({
    user: parsed.user,
    password: parsed.password,
    host: hostAddress,
    port: parsed.port,
    database: parsed.database,
    ssl: { rejectUnauthorized: false },
  })
  const client = await pool.connect()
  console.log("Conectado!")

  try {
    console.log("\n1. Adicionando coluna personalization_order...")
    const r1 = await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS personalization_order INTEGER NOT NULL DEFAULT 0")
    console.log(`   ${r1.command} - OK`)

    console.log("\n2. Atualizando ordem padrao...")
    const r2 = await client.query(`
      WITH numbered AS (
        SELECT id, row_number() OVER (ORDER BY name) * 10 AS new_order
        FROM products WHERE allow_personalization = true
      )
      UPDATE products SET personalization_order = numbered.new_order
      FROM numbered WHERE products.id = numbered.id
    `)
    console.log(`   ${r2.rowCount} produto(s) atualizados`)

    console.log("\n3. Atualizando cache do schema...")
    await client.query("NOTIFY pgrst, 'reload schema'")
    console.log("   OK")

    console.log("\nMIGRACAO APLICADA COM SUCESSO!")
  } catch (err) {
    console.error("\nERRO:", err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()
