-- Migration: 20260627000000_erp_complete_schema.sql
-- Description: ERP complete schema - adds missing columns, tables, indexes, triggers for full ERP functionality

-- ==========================================
-- 1. CUSTOMERS - Add missing fields
-- ==========================================
alter table customers
add column if not exists whatsapp text,
add column if not exists cpf_cnpj text,
add column if not exists address text,
add column if not exists city text,
add column if not exists notes text,
add column if not exists purchase_count integer not null default 0,
add column if not exists total_spent numeric(10, 2) not null default 0,
add column if not exists last_purchase_date timestamp with time zone,
add column if not exists ativo boolean not null default true;

-- ==========================================
-- 2. PRODUCTS - Add missing fields
-- ==========================================
alter table products
add column if not exists internal_code text,
add column if not exists barcode text,
add column if not exists purchase_price numeric(10, 2) not null default 0 check (purchase_price >= 0),
add column if not exists sale_price numeric(10, 2) not null default 0 check (sale_price >= 0),
add column if not exists auto_profit numeric(10, 2) not null default 0,
add column if not exists auto_margin numeric(5, 2) not null default 0,
add column if not exists min_stock integer not null default 5 check (min_stock >= 0),
add column if not exists supplier text,
add column if not exists oculto_catalogo boolean not null default false;

-- Sync sale_price with existing price column
update products set sale_price = price where sale_price = 0 and price > 0;

-- ==========================================
-- 3. ORDERS - Add missing fields
-- ==========================================
alter table orders
add column if not exists delivery_type text not null default 'RETIRADA' check (delivery_type in ('ENTREGA', 'RETIRADA')),
add column if not exists payment_method text,
add column if not exists notes text,
add column if not exists delivery_address text,
add column if not exists total_value numeric(10, 2) not null default 0,
add column if not exists total_profit numeric(10, 2) not null default 0,
add column if not exists nfce_number text,
add column if not exists nfce_key text;

-- Drop basket_id foreign key to allow manual orders without basket
alter table orders
alter column basket_id drop not null;

-- ==========================================
-- 4. ORDER_ITEMS - Add unit price and profit tracking
-- ==========================================
alter table order_items
add column if not exists unit_price numeric(10, 2) not null default 0,
add column if not exists total_price numeric(10, 2) not null default 0,
add column if not exists unit_cost numeric(10, 2) not null default 0,
add column if not exists total_profit numeric(10, 2) not null default 0,
add column if not exists name text;

-- ==========================================
-- 5. STOCK_MOVEMENTS - Add order_id reference and costs
-- ==========================================
alter table stock_movements
add column if not exists order_id uuid references orders(id) on delete set null,
add column if not exists cost numeric(10, 2) default 0,
add column if not exists previous_stock integer not null default 0,
add column if not exists new_stock integer not null default 0,
add column if not exists user_id text;

-- ==========================================
-- 6. FINANCIAL ENTRIES - Add missing fields
-- ==========================================
alter table financial_entries
add column if not exists category text,
add column if not exists description text,
add column if not exists payment_method text,
add column if not exists due_date date,
add column if not exists paid_at timestamp with time zone,
add column if not exists is_paid boolean not null default false,
add column if not exists invoice_url text,
add column if not exists recurring boolean not null default false,
add column if not exists recurring_interval text;

-- Drop and recreate check constraint to include more types
alter table financial_entries drop constraint if exists financial_entries_entry_type_check;
alter table financial_entries add constraint financial_entries_entry_type_check
  check (entry_type in ('RECEITA', 'DESPESA', 'CUSTO', 'MARGEM', 'LUCRO'));

-- ==========================================
-- 7. STORE_SETTINGS - Add missing fields
-- ==========================================
alter table store_settings
add column if not exists facebook text,
add column if not exists instagram text,
add column if not exists youtube text,
add column if not exists tiktok text,
add column if not exists cnpj text,
add column if not exists ie text,
add column if not exists company_phone text,
add column if not exists fiscal_email text;

-- ==========================================
-- 8. NF-E Integration tables
-- ==========================================
create table if not exists nfe_config (
  id boolean primary key default true check (id = true),
  provider text not null default 'nuvem_fiscal' check (provider in ('nuvem_fiscal', 'enotas', 'tecnospeed', 'outro')),
  api_key text,
  api_secret text,
  environment text not null default 'homologacao' check (environment in ('producao', 'homologacao')),
  certificate_expires_at date,
  csc text,
  csc_id text,
  serie_nfe integer not null default 1,
  serie_nfce integer not null default 1,
  ultimo_numero_nfe integer not null default 0,
  ultimo_numero_nfce integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into nfe_config (id) values (true) on conflict (id) do nothing;

create table if not exists nfe_emissions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  emission_type text not null check (emission_type in ('NFE', 'NFCE')),
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'AUTHORIZED', 'DENIED', 'CANCELED', 'ERROR')),
  access_key text,
  number integer,
  serie integer,
  xml_url text,
  danfe_url text,
  error_message text,
  protocol text,
  issued_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 9. REPORTS CACHE table for historical data
-- ==========================================
create table if not exists report_cache (
  id uuid primary key default uuid_generate_v4(),
  report_type text not null,
  report_date date not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(report_type, report_date)
);

-- ==========================================
-- 10. INDEXES for performance
-- ==========================================
create index if not exists idx_customers_cpf_cnpj on customers(cpf_cnpj);
create index if not exists idx_customers_ativo on customers(ativo);
create index if not exists idx_products_internal_code on products(internal_code);
create index if not exists idx_products_barcode on products(barcode);
create index if not exists idx_products_min_stock on products(min_stock);
create index if not exists idx_products_supplier on products(supplier);
create index if not exists idx_orders_delivery_type on orders(delivery_type);
create index if not exists idx_orders_payment_method on orders(payment_method);
create index if not exists idx_orders_nfce on orders(nfce_number);
create index if not exists idx_stock_movements_type on stock_movements(movement_type);
create index if not exists idx_stock_movements_created on stock_movements(created_at);
create index if not exists idx_stock_movements_product on stock_movements(product_id);
create index if not exists idx_financial_entries_type on financial_entries(entry_type);
create index if not exists idx_financial_entries_created on financial_entries(created_at);
create index if not exists idx_financial_entries_paid on financial_entries(is_paid);
create index if not exists idx_nfe_emissions_status on nfe_emissions(status);
create index if not exists idx_nfe_emissions_order on nfe_emissions(order_id);

-- ==========================================
-- 11. TRIGGER: Auto-update customer stats on order change
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

drop trigger if exists trg_update_customer_stats on orders;
create trigger trg_update_customer_stats
after insert or update or delete on orders
for each row
execute function update_customer_stats();

-- ==========================================
-- 12. TRIGGER: Auto-calculate order totals
-- ==========================================
create or replace function calculate_order_totals()
returns trigger as $$
declare
  v_total_value numeric(10, 2) := 0;
  v_total_profit numeric(10, 2) := 0;
begin
  select coalesce(sum(total_price), 0), coalesce(sum(total_profit), 0)
  into v_total_value, v_total_profit
  from order_items
  where order_id = new.id;

  update orders
  set total_value = v_total_value,
      total_profit = v_total_profit
  where id = new.id;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_calculate_order_totals on order_items;
create trigger trg_calculate_order_totals
after insert or update or delete on order_items
for each row
execute function calculate_order_totals();

-- ==========================================
-- 13. TRIGGER: Record stock movement on product stock change
-- ==========================================
create or replace function record_stock_movement()
returns trigger as $$
begin
  if old.stock is distinct from new.stock then
    insert into stock_movements (product_id, movement_type, quantity, reason, previous_stock, new_stock, created_at)
    values (
      new.id,
      case when new.stock > old.stock then 'ENTRADA' else 'SAIDA' end,
      abs(new.stock - old.stock),
      'Ajuste manual',
      old.stock,
      new.stock,
      now()
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_record_stock_movement on products;
create trigger trg_record_stock_movement
after update of stock on products
for each row
when (old.stock is distinct from new.stock)
execute function record_stock_movement();

-- ==========================================
-- 14. FUNCTION: Get dashboard metrics
-- ==========================================
create or replace function get_dashboard_metrics()
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'faturamento_dia', coalesce((select sum(total_value) from orders where created_at::date = current_date and status != 'CANCELADO'), 0),
    'faturamento_semana', coalesce((select sum(total_value) from orders where created_at >= date_trunc('week', current_date) and status != 'CANCELADO'), 0),
    'faturamento_mes', coalesce((select sum(total_value) from orders where created_at >= date_trunc('month', current_date) and status != 'CANCELADO'), 0),
    'faturamento_ano', coalesce((select sum(total_value) from orders where created_at >= date_trunc('year', current_date) and status != 'CANCELADO'), 0),
    'lucro_bruto', coalesce((select sum(total_profit) from orders where created_at >= date_trunc('month', current_date) and status != 'CANCELADO'), 0),
    'lucro_liquido', coalesce((select sum(total_value - total_profit) from orders where created_at >= date_trunc('month', current_date) and status != 'CANCELADO'), 0),
    'total_vendido', coalesce((select sum(total_value) from orders where status != 'CANCELADO'), 0),
    'total_comprado', coalesce((select sum(o.total_value - o.total_profit) from orders o where o.status != 'CANCELADO'), 0),
    'ticket_medio', coalesce((select avg(total_value) from orders where status != 'CANCELADO'), 0),
    'clientes_ativos', (select count(*) from customers where ativo = true),
    'clientes_inativos', (select count(*) from customers where ativo = false),
    'estoque_baixo', (select count(*) from products where ativo = true and stock <= min_stock),
    'pedidos_abertos', (select count(*) from orders where status not in ('FINALIZADO', 'CANCELADO')),
    'pedidos_concluidos', (select count(*) from orders where status = 'FINALIZADO'),
    'margem_lucro', coalesce(
      (select case when sum(total_value) > 0 then round((sum(total_profit) / sum(total_value)) * 100, 2) else 0 end
       from orders where created_at >= date_trunc('month', current_date) and status != 'CANCELADO'), 0)
  ) into result;

  return result;
end;
$$ language plpgsql;
