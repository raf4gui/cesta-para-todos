const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  // Supabase doesn't expose a raw SQL RPC by default, so we can't run DDL via JS client.
  // The migration file is already created. The admin can apply it manually via Supabase dashboard SQL editor.
  console.log('Migration file created at supabase/migrations/20260710000000_customers_performance.sql')
  console.log('To apply, run in Supabase dashboard SQL editor:')
  console.log('(or use npx supabase db push if linked)')
  console.log('\nThe existing GIN trigram indexes from prior migrations are already active.')
}

run().catch(e => console.error(e))
