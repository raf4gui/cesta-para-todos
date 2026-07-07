-- Migration: 20260628000000_fix_all_schema_issues.sql
-- Description: Fix ALL remaining DB issues: missing columns, duplicate FKs, schema alignment

-- ==========================================
-- 1. CATEGORIES - Add missing columns
-- ==========================================
alter table categories
add column if not exists description text,
add column if not exists image text;

-- ==========================================
-- 2. BRANDS - Add missing columns
-- ==========================================
alter table brands
add column if not exists description text,
add column if not exists logo text;

-- ==========================================
-- 3. PRODUCTS - Migrate old category text to category_id FK, then drop text column
-- ==========================================
-- First: migrate data where category_id is null but category text is set
update products p
set category_id = c.id
from categories c
where p.category_id is null
  and p.category is not null
  and lower(trim(p.category)) = lower(trim(c.name));

-- Second: drop the old text column (safe: FK exists)
alter table products
drop column if exists category;

-- Add defaults for boolean columns that are nullable
alter table products
alter column vendido_individualmente set default false,
alter column faz_parte_de_cesta set default false,
alter column faz_parte_de_fardo set default false;

update products set vendido_individualmente = false where vendido_individualmente is null;
update products set faz_parte_de_cesta = false where faz_parte_de_cesta is null;
update products set faz_parte_de_fardo = false where faz_parte_de_fardo is null;

alter table products
alter column vendido_individualmente set not null,
alter column faz_parte_de_cesta set not null,
alter column faz_parte_de_fardo set not null;

-- ==========================================
-- 4. BASKETS - Fix tipo check to only allow valid types
-- Remove: FARDO_BEBIDAS, FARDO_ALIMENTOS, KIT_FRALDAS, CESTA_PRONTA, CESTA_PERSONALIZAVEL
-- Keep: CESTA_PRATICA, CESTA_COMPLETA, CESTAO_FAMILIA, CESTA_PERSONALIZADA
-- ==========================================
alter table baskets drop constraint if exists baskets_tipo_check;
-- Update existing invalid tipos (shouldn't exist but just in case)
update baskets set tipo = 'CESTA_PRATICA' where tipo not in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA');
alter table baskets add constraint baskets_tipo_check
  check (tipo in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA'));

-- Add missing columns for internal pricing and catalog visibility
alter table baskets
add column if not exists internal_price numeric(10, 2),
add column if not exists show_price boolean not null default true,
add column if not exists show_catalog boolean not null default true;

-- ==========================================
-- 5. ORDERS - Add store_id for future multi-tenant
-- ==========================================
alter table orders
add column if not exists origin text check (origin in ('ONLINE','PRESENCIAL','TELEFONE','WHATSAPP','MANUAL')),
add column if not exists internal_notes text;

-- ==========================================
-- 6. STOCK - Create view for stock overview
-- ==========================================
create or replace view stock_overview as
select
  p.id,
  p.name,
  p.stock as current_stock,
  p.min_stock,
  p.supplier,
  p.purchase_price,
  (p.stock * p.purchase_price) as total_cost_value,
  case
    when p.stock <= 0 then 'ESGOTADO'
    when p.stock <= p.min_stock then 'BAIXO'
    else 'NORMAL'
  end as situation,
  p.ativo,
  coalesce(c.name, 'Sem categoria') as category_name,
  coalesce(b.name, 'Sem marca') as brand_name
from products p
left join categories c on c.id = p.category_id
left join brands b on b.id = p.brand_id;

-- ==========================================
-- 7. Fix ambiguous FK relationships for PostgREST
-- Add explicit comment labels to avoid embed ambiguity
-- ==========================================
comment on constraint products_brand_id_fkey on products is 'fk:brand';
comment on constraint products_category_id_fkey on products is 'fk:category';

-- ==========================================
-- 8. Add product brand_id FK comment for ambiguous relationship
-- ==========================================
comment on column products.brand_id is 'FK:brands.id';
comment on column products.category_id is 'FK:categories.id';
comment on column baskets.brand_id is 'FK:brands.id';
comment on column order_items.chosen_brand_id is 'FK:brands.id';

-- ==========================================
-- 9. Add missing indexes
-- ==========================================
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_brand_id on products(brand_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_product_id on order_items(product_id);
create index if not exists idx_basket_items_basket_id on basket_items(basket_id);
create index if not exists idx_basket_items_product_id on basket_items(product_id);
create index if not exists idx_basket_item_brands_basket on basket_item_brands(basket_id);
create index if not exists idx_basket_item_brands_product on basket_item_brands(product_id);
create index if not exists idx_basket_item_brands_brand on basket_item_brands(brand_id);

-- ==========================================
-- 10. Ensure seed categories exist
-- ==========================================
insert into categories (name, description, ativo) values
  ('Cestas', 'Cestas básicas e kits de alimentos', true),
  ('Fardos de Bebidas', 'Fardos com bebidas variadas', true),
  ('Fardos de Alimentos', 'Fardos com alimentos não perecíveis', true),
  ('Kit Fraldas', 'Kits de fraldas e itens infantis', true),
  ('Produtos Gerais', 'Produtos avulsos e diversos', true)
on conflict (name) do nothing;

-- ==========================================
-- 11. Ensure default baskets exist
-- ==========================================
insert into baskets (name, tipo, description, price, ativo, show_price, show_catalog)
select 'Cesta Prática', 'CESTA_PRATICA', 'Cesta básica com itens essenciais', 0, true, true, true
where not exists (select 1 from baskets where name = 'Cesta Prática');
insert into baskets (name, tipo, description, price, ativo, show_price, show_catalog)
select 'Cesta Completa', 'CESTA_COMPLETA', 'Cesta completa com variedade de produtos', 0, true, true, true
where not exists (select 1 from baskets where name = 'Cesta Completa');
insert into baskets (name, tipo, description, price, ativo, show_price, show_catalog)
select 'Cestão Família', 'CESTAO_FAMILIA', 'Cestão para famílias com quantidade extra', 0, true, true, true
where not exists (select 1 from baskets where name = 'Cestão Família');
insert into baskets (name, tipo, description, price, ativo, show_price, show_catalog)
select 'Cesta Personalizada', 'CESTA_PERSONALIZADA', 'Monte sua cesta escolhendo cada item', 0, true, false, true
where not exists (select 1 from baskets where name = 'Cesta Personalizada');

-- ==========================================
-- 12. Fix the order protocol trigger - ensure it works
-- ==========================================
create or replace function generate_order_protocol()
returns trigger as $$
declare
  seq_id integer;
begin
  seq_id := nextval('order_protocol_seq');
  new.protocol := 'CP-' || lpad(seq_id::text, 6, '0');
  return new;
end;
$$ language plpgsql;

-- ==========================================
-- 13. Update the calculate_order_totals to work per-order_id
-- ==========================================
drop trigger if exists trg_calculate_order_totals on order_items;
drop function if exists calculate_order_totals;

create or replace function calculate_order_totals()
returns trigger as $$
declare
  v_order_id uuid;
begin
  if tg_op = 'DELETE' then
    v_order_id := old.order_id;
  else
    v_order_id := new.order_id;
  end if;

  update orders
  set
    total_value = coalesce((select sum(total_price) from order_items where order_id = v_order_id), 0),
    total_profit = coalesce((select sum(total_profit) from order_items where order_id = v_order_id), 0)
  where id = v_order_id;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_calculate_order_totals
after insert or update or delete on order_items
for each row
execute function calculate_order_totals();

-- ==========================================
-- 14. Update customer stats function with better logic
-- ==========================================
create or replace function update_customer_stats()
returns trigger as $$
declare
  v_customer_id uuid;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    v_customer_id := new.customer_id;
  elsif tg_op = 'DELETE' then
    v_customer_id := old.customer_id;
  end if;

  update customers c
  set
    purchase_count = (select count(*) from orders o where o.customer_id = v_customer_id and o.status != 'CANCELADO'),
    total_spent = (select coalesce(sum(total_value), 0) from orders o where o.customer_id = v_customer_id and o.status != 'CANCELADO'),
    last_purchase_date = (select max(created_at) from orders o where o.customer_id = v_customer_id and o.status != 'CANCELADO')
  where c.id = v_customer_id;

  return coalesce(new, old);
end;
$$ language plpgsql;
