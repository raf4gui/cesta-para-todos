-- ==========================================
-- Migration: 20260709000000_fix_schema_gaps
-- Fixes: product_brands table, missing product
-- columns, missing settings columns, fardo
-- customization columns, nullable category_id,
-- price default value
-- ==========================================

-- 1. PRODUCT_BRANDS junction table (was never applied)
create table if not exists product_brands (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  sale_price numeric(10,2) not null default 0,
  purchase_price numeric(10,2) not null default 0,
  stock integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(product_id, brand_id)
);

create index if not exists idx_product_brands_product on product_brands(product_id);
create index if not exists idx_product_brands_brand on product_brands(brand_id);

-- 2. MISSING PRODUCT TOGGLE COLUMNS (was never applied)
alter table products
  add column if not exists show_price boolean not null default true,
  add column if not exists allow_personalization boolean not null default false,
  add column if not exists featured boolean not null default false;

-- 3. MAKE category_id NULLABLE AND price HAVE DEFAULT (simplified product registration)
alter table products alter column category_id drop not null;
alter table products alter column price set default 0;
alter table products alter column price drop not null;

-- 4. BASKET ITEMS FARDO COLUMNS (was never applied)
alter table basket_items
  add column if not exists available_sizes jsonb not null default '[]'::jsonb,
  add column if not exists available_quantities jsonb not null default '[]'::jsonb;

-- 5. STORE SETTINGS TOGGLE COLUMNS (was never applied)
alter table store_settings
  add column if not exists show_prices boolean not null default true,
  add column if not exists show_stock boolean not null default true,
  add column if not exists show_availability boolean not null default true,
  add column if not exists whatsapp_message_template text;

-- 6. BASKETS CATEGORY_ID COLUMN (was never applied)
alter table baskets
  add column if not exists category_id uuid references categories(id) on delete set null;

-- 7. SYNC EXISTING PRODUCT BRANDS
insert into product_brands (product_id, brand_id, sale_price, purchase_price, stock, ativo)
select p.id, p.brand_id, p.sale_price, p.purchase_price, p.stock, true
from products p
where p.brand_id is not null
on conflict (product_id, brand_id) do nothing;

notify pgrst, 'reload schema';
