-- ==========================================
-- Migration: product_brands junction table
-- Each product can have multiple brands with
-- per-brand pricing, stock, and status
-- ==========================================

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

-- Indexes for fast lookups
create index if not exists idx_product_brands_product on product_brands(product_id);
create index if not exists idx_product_brands_brand on product_brands(brand_id);

-- Migrate existing brand relationships from products.brand_id
insert into product_brands (product_id, brand_id, sale_price, purchase_price, stock, ativo)
select p.id, p.brand_id, p.sale_price, p.purchase_price, p.stock, true
from products p
where p.brand_id is not null
on conflict (product_id, brand_id) do nothing;
