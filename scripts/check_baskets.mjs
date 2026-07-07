import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
const getEnv = (k) => env.split('\n').find(l => l.startsWith(k+'='))?.split('=').slice(1).join('=').trim();
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const sb = createClient(url, key);

const tipos = ["CESTA_PRATICA", "CESTA_COMPLETA", "CESTAO_FAMILIA"];
for (const tipo of tipos) {
  const { data: b } = await sb.from('baskets').select('id, name').eq('tipo', tipo).eq('ativo', true).single();
  const { data: items } = await sb.from('basket_items').select('product_id, quantity').eq('basket_id', b.id);
  const productTypes = items?.length ?? 0;
  const totalQty = items?.reduce((s,i) => s + i.quantity, 0) ?? 0;
  console.log(`${b.name} (${tipo}): ${productTypes} product types, ${totalQty} total qty`);
}
