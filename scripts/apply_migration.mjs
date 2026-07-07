/**
 * Aplica a migration UNIQUE constraint em customers(phone) diretamente no banco.
 * 
 * Uso: node scripts/apply_migration.mjs
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

async function run() {
  const env = loadEnv()
  const dbUrl = env.DATABASE_URL

  if (!dbUrl) {
    console.error("DATABASE_URL nao encontrada em .env.local")
    process.exit(1)
  }

  console.log("Conectando ao banco...")
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  const client = await pool.connect()

  try {
    // Step 1: Clean up any customers with empty/null phone
    console.log("\n1. Corrigindo clientes com telefone vazio/nulo...")
    const fixResult = await client.query(`
      update customers set phone = 'SEM_TELEFONE_' || replace(id::text, '-', '')
      where phone is null or phone = '';
    `)
    console.log(`   ${fixResult.rowCount} cliente(s) atualizados`)

    // Step 2: Check for existing duplicates BEFORE adding constraint
    console.log("\n2. Verificando duplicatas existentes...")
    const dupCheck = await client.query(`
      select phone, count(*), array_agg(id::text) as ids
      from customers
      group by phone
      having count(*) > 1
    `)
    
    if (dupCheck.rows.length > 0) {
      console.log(`   ${dupCheck.rows.length} telefone(s) com duplicatas encontrados:`)
      for (const row of dupCheck.rows) {
        console.log(`   Telefone: "${row.phone}" - ${row.count}x`)
        console.log(`   IDs: ${row.ids.join(", ")}`)
      }
      
      // Resolve duplicates: keep the first (oldest) and reassign orders for others
      console.log("\n3. Resolvendo duplicatas (mantendo o registro mais antigo)...")
      for (const row of dupCheck.rows) {
        const ids = row.ids
        const keepId = ids[0] // Keep the first (oldest) one
        const removeIds = ids.slice(1)
        
        // Reassign orders from duplicates to the kept customer
        for (const removeId of removeIds) {
          const reassignResult = await client.query(`
            update orders set customer_id = $1 where customer_id = $2
          `, [keepId, removeId])
          console.log(`   Reatribuidos ${reassignResult.rowCount} pedido(s) de ${removeId.slice(0, 8)} para ${keepId.slice(0, 8)}`)
        }
        
        // Delete duplicate customers
        const deleteResult = await client.query(`
          delete from customers where id = any($1::uuid[])
        `, [removeIds])
        console.log(`   Removidos ${deleteResult.rowCount} cliente(s) duplicado(s) do telefone "${row.phone}"`)
      }
    } else {
      console.log("   Nenhuma duplicata encontrada.")
    }

    // Step 3: Add the UNIQUE constraint
    console.log("\n4. Adicionando UNIQUE constraint em customers(phone)...")
    
    // Drop if exists first (in case it was partially added)
    await client.query(`
      alter table customers drop constraint if exists customers_phone_key;
    `).catch(() => {})

    await client.query(`
      alter table customers add constraint customers_phone_key unique (phone);
    `)
    console.log("   ✅ UNIQUE constraint adicionada com sucesso!")

    // Step 4: Create index
    console.log("\n5. Criando indice para busca por telefone...")
    await client.query(`
      create index if not exists idx_customers_phone_unique on customers(phone);
    `)
    console.log("   ✅ Indice criado.")

    console.log("\n" + "=".repeat(50))
    console.log("MIGRACAO APLICADA COM SUCESSO!")
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
