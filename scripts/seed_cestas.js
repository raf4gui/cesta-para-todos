/**
 * Script de Seed - Inserção das Cestas Iniciais
 * Execução: node ./scripts/seed_cestas.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key + '='))?.split('=').slice(1).join('=').trim();

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Produtos genéricos necessários para as cestas
const PRODUCTS_TO_CREATE = [
  { name: 'Arroz Tipo 1 5kg', category: 'Alimentos', stock: 50, price: 22.00 },
  { name: 'Feijão Carioca 1kg', category: 'Alimentos', stock: 50, price: 8.00 },
  { name: 'Açúcar Refinado 2kg', category: 'Alimentos', stock: 50, price: 7.50 },
  { name: 'Macarrão Espaguete 500g', category: 'Alimentos', stock: 50, price: 4.00 },
  { name: 'Flocão de Milho 500g', category: 'Alimentos', stock: 50, price: 3.50 },
  { name: 'Café Torrado 250g', category: 'Alimentos', stock: 50, price: 9.00 },
  { name: 'Óleo de Soja 900ml', category: 'Alimentos', stock: 50, price: 8.50 },
  { name: 'Farinha de Trigo 1kg', category: 'Alimentos', stock: 50, price: 5.00 },
  { name: 'Sal Refinado 1kg', category: 'Alimentos', stock: 50, price: 2.50 },
  { name: 'Bolacha Cream Cracker 400g', category: 'Alimentos', stock: 50, price: 4.50 },
  { name: 'Refresco em Pó 25g', category: 'Alimentos', stock: 50, price: 1.00 },
  { name: 'Macarrão Instantâneo 65g', category: 'Alimentos', stock: 50, price: 1.50 },
  { name: 'Sabão em Pó 500g', category: 'Limpeza', stock: 50, price: 6.00 },
  { name: 'Creme Dental 90g', category: 'Higiene', stock: 50, price: 3.00 },
  { name: 'Papel Higiênico (4 rolos)', category: 'Higiene', stock: 50, price: 6.00 },
  { name: 'Sabonete 90g', category: 'Higiene', stock: 50, price: 2.50 },
  { name: 'Água Sanitária 1L', category: 'Limpeza', stock: 50, price: 4.50 },
  { name: 'Desinfetante 500ml', category: 'Limpeza', stock: 50, price: 5.00 },
];

// Definição das cestas
const CESTAS = [
  {
    name: 'Cesta Prática',
    tipo: 'CESTA_PRATICA',
    description: 'Cesta básica com os principais itens do dia a dia. Prática e econômica para famílias pequenas.',
    price: 89.99,
    ativo: true,
    items: [
      { name: 'Arroz Tipo 1 5kg', qty: 3 },
      { name: 'Flocão de Milho 500g', qty: 4 },
      { name: 'Café Torrado 250g', qty: 1 },
      { name: 'Macarrão Espaguete 500g', qty: 2 },
      { name: 'Sal Refinado 1kg', qty: 1 },
      { name: 'Feijão Carioca 1kg', qty: 2 },
      { name: 'Bolacha Cream Cracker 400g', qty: 2 },
      { name: 'Refresco em Pó 25g', qty: 2 },
      { name: 'Óleo de Soja 900ml', qty: 1 },
      { name: 'Macarrão Instantâneo 65g', qty: 2 },
    ]
  },
  {
    name: 'Cesta Completa',
    tipo: 'CESTA_COMPLETA',
    description: 'Cesta completa com alimentos e produtos de higiene e limpeza para o mês inteiro.',
    price: 139.99,
    ativo: true,
    items: [
      { name: 'Feijão Carioca 1kg', qty: 2 },
      { name: 'Arroz Tipo 1 5kg', qty: 4 },
      { name: 'Açúcar Refinado 2kg', qty: 3 },
      { name: 'Macarrão Espaguete 500g', qty: 2 },
      { name: 'Café Torrado 250g', qty: 1 },
      { name: 'Óleo de Soja 900ml', qty: 1 },
      { name: 'Farinha de Trigo 1kg', qty: 1 },
      { name: 'Sal Refinado 1kg', qty: 1 },
      { name: 'Flocão de Milho 500g', qty: 4 },
      { name: 'Bolacha Cream Cracker 400g', qty: 2 },
      { name: 'Macarrão Instantâneo 65g', qty: 2 },
      { name: 'Sabão em Pó 500g', qty: 1 },
      { name: 'Creme Dental 90g', qty: 1 },
      { name: 'Papel Higiênico (4 rolos)', qty: 1 },
      { name: 'Sabonete 90g', qty: 2 },
      { name: 'Água Sanitária 1L', qty: 1 },
      { name: 'Desinfetante 500ml', qty: 1 },
    ]
  },
  {
    name: 'Cestão Família',
    tipo: 'CESTAO_FAMILIA',
    description: 'Cesta grande para famílias numerosas. Quantidade reforçada de alimentos essenciais.',
    price: 199.99,
    ativo: true,
    items: [
      { name: 'Arroz Tipo 1 5kg', qty: 5 },
      { name: 'Feijão Carioca 1kg', qty: 4 },
      { name: 'Açúcar Refinado 2kg', qty: 4 },
      { name: 'Macarrão Espaguete 500g', qty: 4 },
      { name: 'Café Torrado 250g', qty: 2 },
      { name: 'Óleo de Soja 900ml', qty: 2 },
      { name: 'Farinha de Trigo 1kg', qty: 2 },
      { name: 'Sal Refinado 1kg', qty: 2 },
      { name: 'Flocão de Milho 500g', qty: 6 },
      { name: 'Bolacha Cream Cracker 400g', qty: 3 },
      { name: 'Sabão em Pó 500g', qty: 2 },
      { name: 'Papel Higiênico (4 rolos)', qty: 2 },
      { name: 'Sabonete 90g', qty: 4 },
      { name: 'Água Sanitária 1L', qty: 2 },
    ]
  }
];

async function seed() {
  console.log('🌱 Iniciando seed de cestas...\n');

  // 1. Criar categoria "Alimentos" se não existir
  const categoryMap = {};
  for (const catName of ['Alimentos', 'Limpeza', 'Higiene']) {
    const { data: existing } = await supabase.from('categories').select('id, name').ilike('name', catName).single();
    if (existing) {
      categoryMap[catName] = existing.id;
      console.log(`✅ Categoria já existe: ${catName}`);
    } else {
      const { data, error } = await supabase.from('categories').insert({ name: catName, ativo: true }).select().single();
      if (error) { console.error(`❌ Erro ao criar categoria ${catName}:`, error.message); continue; }
      categoryMap[catName] = data.id;
      console.log(`✅ Categoria criada: ${catName}`);
    }
  }

  // 2. Criar produtos se não existirem
  const productMap = {};
  for (const prod of PRODUCTS_TO_CREATE) {
    const { data: existing } = await supabase.from('products').select('id, name').ilike('name', prod.name).single();
    if (existing) {
      productMap[prod.name] = existing.id;
      console.log(`  ✓ Produto já existe: ${prod.name}`);
    } else {
      const { data, error } = await supabase.from('products').insert({
        name: prod.name,
        stock: prod.stock,
        price: prod.price,
        ativo: true,
        disponivel: true,
        category_id: categoryMap[prod.category] || null,
        faz_parte_de_cesta: true,
      }).select().single();
      if (error) { console.error(`  ❌ Erro ao criar produto ${prod.name}:`, error.message); continue; }
      productMap[prod.name] = data.id;
      console.log(`  ✓ Produto criado: ${prod.name}`);
    }
  }

  // 3. Criar cestas
  for (const cesta of CESTAS) {
    const { items, ...cestaData } = cesta;
    const { data: existing } = await supabase.from('baskets').select('id').ilike('name', cesta.name).single();
    
    let basketId;
    if (existing) {
      basketId = existing.id;
      console.log(`\n⚠️  Cesta já existe: ${cesta.name} (ID: ${basketId}). Pulando criação.`);
    } else {
      const { data, error } = await supabase.from('baskets').insert(cestaData).select().single();
      if (error) { console.error(`\n❌ Erro ao criar cesta ${cesta.name}:`, error.message); continue; }
      basketId = data.id;
      console.log(`\n✅ Cesta criada: ${cesta.name} (ID: ${basketId})`);
    }
    
    // Inserir itens da cesta
    for (const item of items) {
      const productId = productMap[item.name];
      if (!productId) { console.log(`  ⚠️  Produto não encontrado: ${item.name}`); continue; }
      const { error } = await supabase.from('basket_items').upsert({
        basket_id: basketId,
        product_id: productId,
        quantity: item.qty,
        is_customizable: false,
      });
      if (error) { console.error(`  ❌ Erro ao vincular ${item.name}:`, error.message); }
      else { console.log(`  ✓ Item vinculado: ${item.name} (x${item.qty})`); }
    }
  }

  console.log('\n✅ Seed concluído!');
}

seed().catch(console.error);
