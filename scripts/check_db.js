const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key + '='))?.split('=')[1]?.trim();
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
    
  if (error) {
    console.error('Error fetching tables:', error);
    // Alternatively, try a direct query if the view is not exposed
  } else {
    console.log('Tables in public schema:', data.map(d => d.table_name));
  }
}

checkDb();
