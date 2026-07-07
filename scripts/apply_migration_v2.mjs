/**
 * Aplica UNIQUE constraint via connection pooler do Supabase.
 * Tenta diferentes URLs de conexao.
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
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

const CONNECTION_STRINGS = [
  // Pooler - session mode (port 5432)
  (ref, user, pass) => `postgresql://${user}:${pass}@${ref}.pooler.supabase.com:5432/postgres`,
  // Pooler - transaction mode (port 6543)  
  (ref, user, pass) => `postgresql://${user}:${pass}@${ref}.pooler.supabase.com:6543/postgres`,
  // Direct (original)
  (ref, user, pass) => `postgresql://${user}:${pass}@db.${ref}.supabase.co:5432/postgres`,
]

function extractDbInfo(dbUrl) {
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@(.+):(\d+)\/(.+)/)
  if (!match) return null
  return {
    user: match[1],
    pass: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
    ref: match[3].replace('db.', '').replace('.supabase.co', '')
  }
}

async function tryConnect(connStr) {
  const pool = new pg.Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 })
  try {
    const client = await pool.connect()
    await client.query("SELECT 1")
    client.release()
    return pool
  } catch (err) {
    await pool.end()
    return null
  }
}

async function run() {
  const env = loadEnv()
  const dbUrl = env.DATABASE_URL
  const dbInfo = extractDbInfo(dbUrl)

  if (!dbInfo) {
    console.error("Nao foi possivel parsear DATABASE_URL")
    process.exit(1)
  }

  console.log("Tentando conectar ao banco...")
  const { user, pass, ref } = dbInfo
  
  let pool = null
  let connStr = null
  
  for (const builder of CONNECTION_STRINGS) {
    connStr = builder(ref, user, pass)
    console.log(`  Tentando: ${connStr.slice(0, 50)}...`)
    pool = await tryConnect(connStr)
    if (pool) {
      console.log("  ✅ Conectado!")
      break
    }
  }

  if (!pool) {
    console.error("\nNao foi possivel conectar. Tente aplicar manualmente:")
    console.log("1. Acesse https://supabase.com/dashboard/project/lnntzdncmdpjiescgwwj/sql/new")
    console.log("2. Cole o conteudo do arquivo: supabase/migrations/20260702000000_fix_customer_phone_unique.sql")
    console.log("3. Execute")
    process.exit(1)
  }

  const client = await pool.connect()

  try {
    // Step 1: Fix empty/null phones
    console.log("\n1. Corrigindo telefones vazios/nulos...")
    const fixResult = await client.query(`
      update customers set phone = 'SEM_TELEFONE_' || replace(id::text, '-', '')
      where phone is null or phone = '';
    `)
    console.log(`   ${fixResult.rowCount} cliente(s) atualizados`)

    // Step 2: Check for duplicates
    console.log("\n2. Verificando duplicatas...")
    const dupCheck = await client.query(`
      select phone, count(*), array_agg(id::text) as ids
      from customers
      group by phone
      having count(*) > 1
    `)
    
    if (dupCheck.rows.length > 0) {
      console.log(`   ${dupCheck.rows.length} telefone(s) duplicados:`)
      for (const row of dupCheck.rows) {
        console.log(`   "${row.phone}" - ${row.count}x: ${row.ids.join(", ").slice(0, 80)}...`)
        
        const ids = row.ids
        const keepId = ids[0]
        const removeIds = ids.slice(1)

        for (const removeId of removeIds) {
          const reassignResult = await client.query(`
            update orders set customer_id = $1 where customer_id = $2
          `, [keepId, removeId])
          console.log(`     → ${reassignResult.rowCount} pedido(s) reatribuidos de ${removeId.slice(0,8)} para ${keepId.slice(0,8)}`)
        }

        const deleteResult = await client.query(`
          delete from customers where id = any($1::uuid[])
        `, [removeIds])
        console.log(`     → ${deleteResult.rowCount} duplicata(s) removida(s)`)
      }
    } else {
      console.log("   Nenhuma duplicata encontrada.")
    }

    // Step 3: Add UNIQUE constraint
    console.log("\n3. Adicionando UNIQUE constraint...")
    await client.query(`alter table customers drop constraint if exists customers_phone_key;`)
    await client.query(`alter table customers add constraint customers_phone_key unique (phone);`)
    console.log("   ✅ UNIQUE constraint adicionada!")

    // Step 4: Create index
    console.log("\n4. Criando indice...")
    await client.query(`create index if not exists idx_customers_phone_unique on customers(phone);`)
    console.log("   ✅ Indice criado.")

    console.log("\n" + "=".repeat(50))
    console.log("✅ MIGRACAO APLICADA COM SUCESSO!")
    console.log("=".repeat(50))
  } catch (err) {
    console.error("\nERRO:", err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()
