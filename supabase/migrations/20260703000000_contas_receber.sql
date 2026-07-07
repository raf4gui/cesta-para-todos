-- Migration: 20260703000000_contas_receber.sql
-- Description: Accounts Receivable module + financial_entries enhancements

-- ==========================================
-- 1. CONTAS A RECEBER table
-- ==========================================
create table if not exists contas_receber (
  id uuid primary key default uuid_generate_v4(),
  descricao text not null default '',
  valor decimal(12,2) not null default 0,
  data_vencimento date not null,
  data_recebimento date,
  status text not null default 'pendente' check (status in ('pendente', 'recebido', 'cancelado')),
  pedido_id uuid references orders(id) on delete set null,
  cliente_id uuid references customers(id) on delete set null,
  observacao text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table contas_receber enable row level security;
create policy "contas_receber all" on contas_receber for all using (true) with check (true);

-- Indexes
create index if not exists idx_contas_receber_status on contas_receber(status);
create index if not exists idx_contas_receber_data_vencimento on contas_receber(data_vencimento);

-- ==========================================
-- 2. TRIGGER: updated_at
-- ==========================================
create or replace function update_contas_receber_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contas_receber_updated_at on contas_receber;
create trigger trg_contas_receber_updated_at
  before update on contas_receber
  for each row execute function update_contas_receber_updated_at();

-- ==========================================
-- 3. TRIGGER: auto-create contas_receber when order is finalized
-- ==========================================
create or replace function auto_create_contas_receber()
returns trigger as $$
declare
  v_total decimal(12,2);
begin
  select coalesce(sum(total_price), 0)
  into v_total
  from order_items
  where order_id = new.id;

  insert into contas_receber (descricao, valor, data_vencimento, status, pedido_id, cliente_id)
  values (
    'Pedido ' || new.protocol,
    v_total,
    current_date + interval '30 days',
    'pendente',
    new.id,
    new.customer_id
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auto_create_contas_receber on orders;
create trigger trg_auto_create_contas_receber
  after update on orders
  for each row
  when (new.status = 'FINALIZADO' and (old.status is null or old.status != 'FINALIZADO'))
  execute function auto_create_contas_receber();

-- ==========================================
-- 4. ENHANCE financial_entries with extra fields
-- ==========================================
alter table financial_entries add column if not exists fornecedor text default '';
alter table financial_entries add column if not exists comprovante_url text default '';
