-- Migration: 20260525000000_init_schema.sql
-- Description: Inicialização do esquema de banco de dados para o Cesta para Todos

-- Habilitar UUID se necessário
create extension if not exists "uuid-ossp";

-- 1. Tabela de administradores (users)
-- Linkada ao auth.users do Supabase
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de clientes (customers)
create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Marcas (brands)
create table brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Produtos (products)
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand_id uuid references brands(id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Cestas (baskets)
create table baskets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Relação Cesta e Itens (basket_items)
create table basket_items (
  basket_id uuid references baskets(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  is_customizable boolean not null default true,
  primary key (basket_id, product_id)
);

-- Sequência para Protocolo de Pedidos
create sequence order_protocol_seq start 1;

-- 7. Pedidos (orders)
create table orders (
  id uuid primary key default uuid_generate_v4(),
  protocol text not null unique,
  customer_id uuid references customers(id) on delete restrict not null,
  basket_id uuid references baskets(id) on delete restrict not null,
  status text not null default 'AGUARDANDO_CONTATO' check (status in ('AGUARDANDO_CONTATO', 'EM_NEGOCIACAO', 'PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO', 'CANCELADO')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Itens do Pedido (order_items)
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete restrict not null,
  quantity integer not null check (quantity > 0)
);

-- 9. Histórico de Status (order_status_history)
create table order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  old_status text,
  new_status text not null,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- TRIGGERS E FUNÇÕES AUTOMÁTICAS (DETERMINÍSTICAS)
-- ==========================================

-- A. Geração Automática de Protocolo Sequencial (CP-XXXXXX)
create or replace function generate_order_protocol()
returns trigger as $$
begin
  new.protocol := 'CP-' || lpad(nextval('order_protocol_seq')::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_generate_order_protocol
before insert on orders
for each row
execute function generate_order_protocol();

-- B. Histórico de Status Inicial
create or replace function handle_order_insert()
returns trigger as $$
begin
  insert into order_status_history (order_id, old_status, new_status)
  values (new.id, null, new.status);
  return new;
end;
$$ language plpgsql;

create trigger trg_handle_order_insert
after insert on orders
for each row
execute function handle_order_insert();

-- C. Mudança de Status e Dedução/Estorno Automático de Estoque
create or replace function handle_order_status_change()
returns trigger as $$
declare
  item record;
  is_old_operational boolean;
  is_new_operational boolean;
begin
  -- Registrar no histórico
  insert into order_status_history (order_id, old_status, new_status)
  values (new.id, old.status, new.status);

  -- Definir se os status antigo e novo são operacionais (com baixa de estoque)
  is_old_operational := old.status in ('PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO');
  is_new_operational := new.status in ('PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO');

  -- Transição de NÃO operacional para OPERACIONAL -> Deduzir Estoque
  if is_new_operational and not is_old_operational then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      update products
      set stock = stock - item.quantity
      where id = item.product_id;

      if (select stock from products where id = item.product_id) < 0 then
        raise exception 'Produto com ID % possui estoque insuficiente.', item.product_id;
      end if;
    end loop;

  -- Transição de OPERACIONAL para NÃO operacional (ex: CANCELADO ou retorno para EM_NEGOCIACAO) -> Devolver Estoque
  elsif not is_new_operational and is_old_operational then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      update products
      set stock = stock + item.quantity
      where id = item.product_id;
    end loop;
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_handle_order_status_change
before update on orders
for each row
execute function handle_order_status_change();
