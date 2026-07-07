import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key + '='))?.split('=').slice(1).join('=').trim();

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Product definitions with full details
const PRODUCTS = [
  // === ALIMENTOS ===
  { name: 'Arroz Tipo 1 5kg',         category: 'Alimentos', stock: 80,  purchase_price: 16.00, sale_price: 22.90, price: 20.00, internal_cost: 18.00, peso: '5kg',    unidade: 'Pacote', brand: 'Tio Joao',   allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Feijão Carioca 1kg',       category: 'Alimentos', stock: 80,  purchase_price: 5.50,  sale_price: 8.90,  price: 7.50,  internal_cost: 6.50,  peso: '1kg',    unidade: 'Pacote', brand: 'Camil',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Açúcar Refinado 2kg',      category: 'Alimentos', stock: 60,  purchase_price: 4.80,  sale_price: 7.50,  price: 6.50,  internal_cost: 5.50,  peso: '2kg',    unidade: 'Pacote', brand: 'Uniao',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Macarrão Espaguete 500g',  category: 'Alimentos', stock: 100, purchase_price: 2.80,  sale_price: 4.50,  price: 3.90,  internal_cost: 3.20,  peso: '500g',   unidade: 'Pacote', brand: 'Dona Benta',allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Flocão de Milho 500g',     category: 'Alimentos', stock: 60,  purchase_price: 2.20,  sale_price: 3.90,  price: 3.20,  internal_cost: 2.80,  peso: '500g',   unidade: 'Pacote', brand: 'Vitarella', allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Café Torrado 250g',        category: 'Alimentos', stock: 50,  purchase_price: 7.00,  sale_price: 12.90, price: 10.50, internal_cost: 8.50,  peso: '250g',   unidade: 'Pacote', brand: 'Pilao',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Óleo de Soja 900ml',       category: 'Alimentos', stock: 70,  purchase_price: 6.50,  sale_price: 9.90,  price: 8.50,  internal_cost: 7.50,  volume: '900ml', unidade: 'Garrafa', brand: 'Liza',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Farinha de Trigo 1kg',     category: 'Alimentos', stock: 60,  purchase_price: 3.20,  sale_price: 5.50,  price: 4.80,  internal_cost: 4.00,  peso: '1kg',    unidade: 'Pacote', brand: 'Renata',    allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Sal Refinado 1kg',         category: 'Alimentos', stock: 60,  purchase_price: 1.50,  sale_price: 2.90,  price: 2.50,  internal_cost: 1.80,  peso: '1kg',    unidade: 'Pacote', brand: 'Cisne',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Bolacha Cream Cracker 400g', category: 'Alimentos', stock: 80, purchase_price: 3.20,  sale_price: 5.90,  price: 4.80,  internal_cost: 4.00,  peso: '400g',   unidade: 'Pacote', brand: 'Mabel',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Refresco em Pó 25g',       category: 'Alimentos', stock: 120, purchase_price: 0.60,  sale_price: 1.50,  price: 1.20,  internal_cost: 0.90,  peso: '25g',    unidade: 'Sachê',   brand: 'Tang',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Macarrão Instantâneo 65g',  category: 'Alimentos', stock: 120, purchase_price: 0.80,  sale_price: 1.90,  price: 1.50,  internal_cost: 1.10,  peso: '65g',    unidade: 'Pacote', brand: 'Nissin',    allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Leite em Pó Integral 400g', category: 'Alimentos', stock: 40, purchase_price: 12.00, sale_price: 18.90, price: 16.00, internal_cost: 14.00, peso: '400g',   unidade: 'Pacote', brand: 'Ninho',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Achocolatado em Pó 400g',   category: 'Alimentos', stock: 50, purchase_price: 5.50,  sale_price: 9.90,  price: 8.00,  internal_cost: 6.50,  peso: '400g',   unidade: 'Pacote', brand: 'Nescau',    allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Extrato de Tomate 340g',    category: 'Alimentos', stock: 60, purchase_price: 2.50,  sale_price: 4.90,  price: 3.80,  internal_cost: 3.00,  peso: '340g',   unidade: 'Pacote', brand: 'Quero',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Molho de Tomate 340g',      category: 'Alimentos', stock: 60, purchase_price: 2.00,  sale_price: 3.90,  price: 3.20,  internal_cost: 2.50,  peso: '340g',   unidade: 'Pacote', brand: 'Predilecta',allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Milho em Lata 200g',        category: 'Alimentos', stock: 50, purchase_price: 3.00,  sale_price: 5.50,  price: 4.50,  internal_cost: 3.50,  peso: '200g',   unidade: 'Lata',    brand: 'Quero',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Ervilha em Lata 200g',       category: 'Alimentos', stock: 50, purchase_price: 3.00,  sale_price: 5.50,  price: 4.50,  internal_cost: 3.50,  peso: '200g',   unidade: 'Lata',    brand: 'Quero',     allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Atum em Lata 170g',         category: 'Alimentos', stock: 40, purchase_price: 4.00,  sale_price: 7.90,  price: 6.50,  internal_cost: 5.00,  peso: '170g',   unidade: 'Lata',    brand: 'Piraque',   allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Biscoito Recheado 140g',    category: 'Alimentos', stock: 80, purchase_price: 2.00,  sale_price: 3.90,  price: 3.20,  internal_cost: 2.50,  peso: '140g',   unidade: 'Pacote', brand: 'Bauducco',  allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Farinha de Mandioca 500g',  category: 'Alimentos', stock: 40, purchase_price: 2.50,  sale_price: 4.50,  price: 3.80,  internal_cost: 3.00,  peso: '500g',   unidade: 'Pacote', brand: 'Yoki',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },

  // === HIGIENE ===
  { name: 'Sabonete 90g',             category: 'Higiene',   stock: 100, purchase_price: 1.50,  sale_price: 2.90,  price: 2.50,  internal_cost: 1.80,  peso: '90g',    unidade: 'Unidade', brand: 'Dove',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Creme Dental 90g',         category: 'Higiene',   stock: 80,  purchase_price: 2.00,  sale_price: 3.90,  price: 3.20,  internal_cost: 2.50,  peso: '90g',    unidade: 'Unidade', brand: 'Colgate',   allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Papel Higiênico 4 Rolo',   category: 'Higiene',   stock: 60,  purchase_price: 4.00,  sale_price: 7.90,  price: 6.50,  internal_cost: 5.00,  unidade: 'Pacote', brand: 'Personal',  allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Shampoo 200ml',            category: 'Higiene',   stock: 50,  purchase_price: 5.00,  sale_price: 9.90,  price: 8.00,  internal_cost: 6.50,  volume: '200ml', unidade: 'Unidade', brand: 'Dove',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Desodorante Spray 150ml',  category: 'Higiene',   stock: 50,  purchase_price: 6.00,  sale_price: 11.90, price: 9.50,  internal_cost: 7.50,  volume: '150ml', unidade: 'Unidade', brand: 'Rexona',    allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Absorvente 8 unid',        category: 'Higiene',   stock: 60,  purchase_price: 3.50,  sale_price: 6.90,  price: 5.50,  internal_cost: 4.50,  unidade: 'Pacote', brand: 'Always',    allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Condicionador 200ml',      category: 'Higiene',   stock: 50,  purchase_price: 5.00,  sale_price: 9.90,  price: 8.00,  internal_cost: 6.50,  volume: '200ml', unidade: 'Unidade', brand: 'Seda',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Aparelho de Barbear',       category: 'Higiene',   stock: 60,  purchase_price: 2.50,  sale_price: 4.90,  price: 4.00,  internal_cost: 3.00,  unidade: 'Unidade', brand: 'Gillette',  allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },

  // === LIMPEZA ===
  { name: 'Sabão em Pó 500g',        category: 'Limpeza',   stock: 60,  purchase_price: 4.50,  sale_price: 7.90,  price: 6.50,  internal_cost: 5.50,  peso: '500g',   unidade: 'Pacote', brand: 'OMO',       allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Água Sanitária 1L',        category: 'Limpeza',   stock: 60,  purchase_price: 3.00,  sale_price: 5.50,  price: 4.50,  internal_cost: 3.80,  volume: '1L',    unidade: 'Garrafa', brand: 'Qboa',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Desinfetante 500ml',       category: 'Limpeza',   stock: 60,  purchase_price: 3.50,  sale_price: 6.50,  price: 5.50,  internal_cost: 4.50,  volume: '500ml', unidade: 'Garrafa', brand: 'Veja',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Detergente Líquido 500ml',  category: 'Limpeza',   stock: 80,  purchase_price: 1.80,  sale_price: 3.50,  price: 2.80,  internal_cost: 2.20,  volume: '500ml', unidade: 'Garrafa', brand: 'Ype',       allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Lustra Móveis 200ml',       category: 'Limpeza',   stock: 40,  purchase_price: 3.00,  sale_price: 5.90,  price: 4.80,  internal_cost: 4.00,  volume: '200ml', unidade: 'Garrafa', brand: 'Poliflor',  allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Saco de Lixo 30L',         category: 'Limpeza',   stock: 60,  purchase_price: 2.50,  sale_price: 4.90,  price: 4.00,  internal_cost: 3.20,  unidade: 'Pacote', brand: 'Copobras',  allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Esponja de Limpeza',        category: 'Limpeza',   stock: 100, purchase_price: 0.80,  sale_price: 1.90,  price: 1.50,  internal_cost: 1.10,  unidade: 'Unidade', brand: 'Bombril',   allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
  { name: 'Multi-uso 500ml',           category: 'Limpeza',   stock: 50,  purchase_price: 3.00,  sale_price: 5.50,  price: 4.50,  internal_cost: 3.80,  volume: '500ml', unidade: 'Garrafa', brand: 'Veja',      allow_personalization: true, faz_parte_de_cesta: true, vendido_individualmente: true },
];

// Basket definitions
const CESTAS = [
  {
    name: 'Cesta Prática',
    tipo: 'CESTA_PRATICA',
    description: 'Cesta básica com os principais itens do dia a dia. Prática e econômica para famílias pequenas.',
    price: 89.90,
    show_catalog: true,
    items: [
      { name: 'Arroz Tipo 1 5kg',          qty: 3 },
      { name: 'Flocão de Milho 500g',      qty: 4 },
      { name: 'Café Torrado 250g',         qty: 1 },
      { name: 'Macarrão Espaguete 500g',   qty: 2 },
      { name: 'Sal Refinado 1kg',          qty: 1 },
      { name: 'Feijão Carioca 1kg',        qty: 2 },
      { name: 'Bolacha Cream Cracker 400g', qty: 2 },
      { name: 'Refresco em Pó 25g',        qty: 2 },
      { name: 'Óleo de Soja 900ml',        qty: 1 },
      { name: 'Macarrão Instantâneo 65g',  qty: 2 },
      { name: 'Sabonete 90g',              qty: 2 },
      { name: 'Creme Dental 90g',          qty: 1 },
      { name: 'Detergente Líquido 500ml',   qty: 1 },
      { name: 'Esponja de Limpeza',         qty: 2 },
    ]
  },
  {
    name: 'Cesta Completa',
    tipo: 'CESTA_COMPLETA',
    description: 'Cesta completa com alimentos e produtos de higiene e limpeza para o mês inteiro.',
    price: 139.90,
    show_catalog: true,
    items: [
      { name: 'Feijão Carioca 1kg',        qty: 2 },
      { name: 'Arroz Tipo 1 5kg',          qty: 4 },
      { name: 'Açúcar Refinado 2kg',       qty: 3 },
      { name: 'Macarrão Espaguete 500g',   qty: 2 },
      { name: 'Café Torrado 250g',         qty: 1 },
      { name: 'Óleo de Soja 900ml',        qty: 1 },
      { name: 'Farinha de Trigo 1kg',      qty: 1 },
      { name: 'Sal Refinado 1kg',          qty: 1 },
      { name: 'Flocão de Milho 500g',      qty: 4 },
      { name: 'Bolacha Cream Cracker 400g', qty: 2 },
      { name: 'Macarrão Instantâneo 65g',  qty: 2 },
      { name: 'Sabão em Pó 500g',          qty: 1 },
      { name: 'Creme Dental 90g',          qty: 1 },
      { name: 'Papel Higiênico 4 Rolo',    qty: 1 },
      { name: 'Sabonete 90g',              qty: 2 },
      { name: 'Água Sanitária 1L',         qty: 1 },
      { name: 'Desinfetante 500ml',        qty: 1 },
      { name: 'Achocolatado em Pó 400g',   qty: 1 },
      { name: 'Extrato de Tomate 340g',    qty: 2 },
      { name: 'Biscoito Recheado 140g',    qty: 2 },
    ]
  },
  {
    name: 'Cestão Família',
    tipo: 'CESTAO_FAMILIA',
    description: 'Cesta grande para famílias numerosas. Quantidade reforçada de alimentos essenciais.',
    price: 199.90,
    show_catalog: true,
    items: [
      { name: 'Arroz Tipo 1 5kg',          qty: 5 },
      { name: 'Feijão Carioca 1kg',        qty: 4 },
      { name: 'Açúcar Refinado 2kg',       qty: 4 },
      { name: 'Macarrão Espaguete 500g',   qty: 4 },
      { name: 'Café Torrado 250g',         qty: 2 },
      { name: 'Óleo de Soja 900ml',        qty: 2 },
      { name: 'Farinha de Trigo 1kg',      qty: 2 },
      { name: 'Sal Refinado 1kg',          qty: 2 },
      { name: 'Flocão de Milho 500g',      qty: 6 },
      { name: 'Bolacha Cream Cracker 400g', qty: 3 },
      { name: 'Sabão em Pó 500g',          qty: 2 },
      { name: 'Papel Higiênico 4 Rolo',    qty: 2 },
      { name: 'Sabonete 90g',              qty: 4 },
      { name: 'Água Sanitária 1L',         qty: 2 },
      { name: 'Desinfetante 500ml',        qty: 2 },
      { name: 'Detergente Líquido 500ml',   qty: 2 },
      { name: 'Creme Dental 90g',          qty: 2 },
      { name: 'Leite em Pó Integral 400g',  qty: 2 },
      { name: 'Achocolatado em Pó 400g',   qty: 2 },
      { name: 'Extrato de Tomate 340g',    qty: 3 },
    ]
  },
];

// Map known brand name variants to what's in the DB
const BRAND_ALIASES = {
  'Tio Joao': 'Tio João',
  'Uniao': 'União',
  'Cisne': 'Cisne',
  'Nissin': 'Nissin',
  'Ninho': 'Ninho',
  'Tang': 'Tang',
  'Poliflor': 'Poliflor',
  'Always': 'Always',
};

async function findBrand(brandName) {
  // Try exact match first
  const { data: exact } = await supabase.from('brands').select('id, name').eq('name', brandName).single();
  if (exact) return exact;

  // Try alias
  const alias = BRAND_ALIASES[brandName];
  if (alias) {
    const { data: aliasResult } = await supabase.from('brands').select('id, name').eq('name', alias).single();
    if (aliasResult) return aliasResult;
  }

  // Try ILIKE
  const { data: ilike } = await supabase.from('brands').select('id, name').ilike('name', brandName).maybeSingle();
  if (ilike) return ilike;

  // Try ILIKE with partial match
  const { data: partial } = await supabase.from('brands').select('id, name').ilike('name', `%${brandName}%`).limit(1).single();
  if (partial) return partial;

  return null;
}

async function seed() {
  console.log('\n🌱 SEED COMPREENSIVO - Cesta Para Todos\n');

  // 1. Get existing categories
  console.log('📦 Categorias...');
  const { data: categories } = await supabase.from('categories').select('id, name');
  const categoryMap = {};
  for (const cat of categories ?? []) {
    categoryMap[cat.name] = cat.id;
  }
  console.log(`   ${Object.keys(categoryMap).length} categorias encontradas`);

  // 2. Get all brands
  console.log('🏷️  Marcas...');
  const { data: allBrands } = await supabase.from('brands').select('id, name').eq('ativo', true);
  const brandMap = {};
  for (const b of allBrands ?? []) {
    brandMap[b.name] = b;
  }
  console.log(`   ${Object.keys(brandMap).length} marcas ativas encontradas`);

  // 3. Create/update products
  console.log('\n📦 Criando/atualizando produtos...');
  let created = 0, updated = 0, skipped = 0;
  const productMap = {};

  for (const prod of PRODUCTS) {
    const { data: existing } = await supabase.from('products').select('id').ilike('name', prod.name).maybeSingle();

    if (existing) {
      const { error: updErr } = await supabase.from('products').update({
        purchase_price: prod.purchase_price,
        sale_price: prod.sale_price,
        price: prod.price,
        internal_cost: prod.internal_cost,
        stock: prod.stock,
        min_stock: 5,
        peso: prod.peso || null,
        volume: prod.volume || null,
        unidade: prod.unidade || null,
        category_id: categoryMap[prod.category] || null,
        allow_personalization: prod.allow_personalization,
        vendido_individualmente: prod.vendido_individualmente,
        faz_parte_de_cesta: prod.faz_parte_de_cesta,
        show_price: true,
        ativo: true,
        disponivel: true,
      }).eq('id', existing.id);

      if (updErr) {
        console.log(`   ⚠️  Erro ao atualizar "${prod.name}": ${updErr.message}`);
      } else {
        updated++;
      }
      productMap[prod.name] = existing.id;
    } else {
      const { data: createdProd, error: prodErr } = await supabase.from('products').insert({
        name: prod.name,
        description: `${prod.name} - Produto de qualidade para sua cesta.`,
        purchase_price: prod.purchase_price,
        sale_price: prod.sale_price,
        price: prod.price,
        internal_cost: prod.internal_cost,
        stock: prod.stock,
        min_stock: 5,
        peso: prod.peso || null,
        volume: prod.volume || null,
        unidade: prod.unidade || null,
        category_id: categoryMap[prod.category] || null,
        allow_personalization: prod.allow_personalization,
        vendido_individualmente: prod.vendido_individualmente,
        faz_parte_de_cesta: prod.faz_parte_de_cesta,
        show_price: true,
        ativo: true,
        disponivel: true,
      }).select().single();

      if (prodErr) {
        console.log(`   ❌ Erro ao criar "${prod.name}": ${prodErr.message}`);
        continue;
      }
      productMap[prod.name] = createdProd.id;
      created++;
    }

    // 4. Assign brand via product_brands
    const brandMatch = await findBrand(prod.brand);
    if (brandMatch) {
      const { error: pbErr } = await supabase.from('product_brands').upsert({
        product_id: productMap[prod.name],
        brand_id: brandMatch.id,
        sale_price: prod.sale_price,
        purchase_price: prod.purchase_price,
        stock: prod.stock,
        ativo: true,
      }, { onConflict: 'product_id,brand_id' });

      if (pbErr) {
        console.log(`   ⚠️  Erro ao vincular marca "${prod.brand}" a "${prod.name}": ${pbErr.message}`);
      }
    } else {
      console.log(`   ⚠️  Marca "${prod.brand}" não encontrada para "${prod.name}"`);
    }
  }

  console.log(`\n✅ Produtos: ${created} criados, ${updated} atualizados, ${skipped} pulados`);

  // 5. Create/update baskets
  console.log('\n🧺 Criando/atualizando cestas...');
  for (const cesta of CESTAS) {
    const { items, ...cestaData } = cesta;

    const { data: existing } = await supabase.from('baskets').select('id').ilike('name', cesta.name).maybeSingle();

    let basketId;
    if (existing) {
      basketId = existing.id;
      await supabase.from('baskets').update({
        ...cestaData,
        ativo: true,
      }).eq('id', basketId);
      console.log(`   ✅ Cesta atualizada: ${cesta.name}`);
    } else {
      const { data: newBasket, error: basketErr } = await supabase.from('baskets').insert({
        ...cestaData,
        ativo: true,
      }).select().single();
      if (basketErr) {
        console.log(`   ❌ Erro ao criar cesta "${cesta.name}": ${basketErr.message}`);
        continue;
      }
      basketId = newBasket.id;
      console.log(`   ✅ Cesta criada: ${cesta.name}`);
    }

    // Delete existing items for this basket and re-insert
    await supabase.from('basket_items').delete().eq('basket_id', basketId);

    for (const item of items) {
      const productId = productMap[item.name];
      if (!productId) {
        console.log(`      ⚠️  Produto não encontrado: ${item.name}`);
        continue;
      }
      const { error: itemErr } = await supabase.from('basket_items').insert({
        basket_id: basketId,
        product_id: productId,
        quantity: item.qty,
        is_customizable: false,
      });
      if (itemErr) {
        console.log(`      ❌ Erro ao vincular ${item.name}: ${itemErr.message}`);
      }
    }

    // Verify items count
    const { count } = await supabase.from('basket_items').select('*', { count: 'exact', head: true }).eq('basket_id', basketId);
    console.log(`      📊 ${count} itens vinculados`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
}

seed().catch(console.error);
