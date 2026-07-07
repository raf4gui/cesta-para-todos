const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lnntzdncmdpjiescgwwj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubnR6ZG5jbWRwamllc2Nnd3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY3MjI2MSwiZXhwIjoyMDk1MjQ4MjYxfQ.4qzvjTZHWJ5YjRgDRWHEQuJbWKlGnBh0En62otkdnM8';

const sb = createClient(supabaseUrl, serviceKey);

async function main() {
  const sql = fs.readFileSync('supabase/migrations/20260708000002_fardo_customization.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().toLowerCase().startsWith('notify'));

  for (const stmt of statements) {
    try {
      const { error } = await sb.rpc('exec_sql', { sql: stmt.trim() });
      if (error) {
        // exec_sql might not exist; try via REST API /rest/v1/rpc/
        console.log('RPC failed:', error.message);
        console.log('Trying alternative approach...');
      } else {
        console.log('OK:', stmt.trim().substring(0, 80));
      }
    } catch (e) {
      console.log('Error executing:', e.message);
    }
  }

  // Alternative: Use the management API
  // Since exec_sql RPC doesn't exist, let's use the management API
  const managementToken = serviceKey;
  const projectRef = 'lnntzdncmdpjiescgwwj';

  // Try the direct SQL via pg connection we know works
  console.log('\nExecuting via direct REST with Service Role...');

  // Use the storage admin API or just run via supabase directly
  // For now, try via /rest/v1/ with a custom query
  const { data, error } = await sb.from('basket_items').select('id').limit(1);
  if (error) {
    console.error('Error connecting:', error.message);
  } else {
    console.log('Connected OK, sample basket_item ID:', data[0]?.id || 'none');

    // Try to ALTER TABLE via supabase SQL
    const alterSQL = "ALTER TABLE basket_items ADD COLUMN IF NOT EXISTS available_sizes JSONB NOT NULL DEFAULT '[]'::jsonb;";
    const alterSQL2 = "ALTER TABLE basket_items ADD COLUMN IF NOT EXISTS available_quantities JSONB NOT NULL DEFAULT '[]'::jsonb;";

    // We need to use supabase's SQL execution. Let's try a workaround:
    // Use fetch to the management API
    const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: alterSQL })
    });

    const result = await resp.text();
    console.log('Management API result:', resp.status, result);
  }
}
main().catch(console.error);
