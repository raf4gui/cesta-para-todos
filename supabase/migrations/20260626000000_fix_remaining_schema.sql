-- Corrige colunas faltantes no store_settings
alter table store_settings
add column if not exists company_name text not null default 'Cesta para Todos',
add column if not exists institutional_text text not null default 'Cestas básicas e kits montados para famílias, empresas e compras recorrentes. Soluções práticas e atendimento de excelência.',
add column if not exists logo_url text not null default '/logo-cesta-para-todos.png';

-- Adiciona índice para busca textual na tabela de clientes
create index if not exists idx_customers_name on customers using gin(name gin_trgm_ops);
create index if not exists idx_customers_phone on customers using gin(phone gin_trgm_ops);

-- Adiciona índices para melhor performance
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);
create index if not exists idx_products_name on products(name);
create index if not exists idx_products_ativo on products(ativo);
create index if not exists idx_baskets_ativo on baskets(ativo);
create index if not exists idx_brands_ativo on brands(ativo);
create index if not exists idx_categories_ativo on categories(ativo);

-- Habilita extensão pg_trgm se não estiver habilitada
create extension if not exists pg_trgm;
