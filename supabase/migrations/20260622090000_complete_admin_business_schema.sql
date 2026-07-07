-- Completa lacunas do MVP administrativo e do modelo de negócio real.

create extension if not exists "uuid-ossp";

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  ativo boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table products
add column if not exists category_id uuid references categories(id) on delete set null,
add column if not exists internal_cost numeric(10, 2) not null default 0 check (internal_cost >= 0);

alter table order_items
add column if not exists chosen_brand_id uuid references brands(id) on delete set null;

create table if not exists stock_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  movement_type text not null check (movement_type in ('ENTRADA', 'SAIDA', 'AJUSTE')),
  quantity integer not null check (quantity <> 0),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists financial_entries (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete set null,
  entry_type text not null check (entry_type in ('CUSTO', 'RECEITA', 'MARGEM', 'LUCRO')),
  amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'FUNCIONARIO' check (role in ('ADMINISTRADOR', 'FUNCIONARIO')),
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists order_notes (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into categories (name, ativo)
values
  ('Cestas', true),
  ('Fardos de Bebidas', true),
  ('Fardos de Alimentos', true),
  ('Kits Fraldas', true),
  ('Produtos Gerais', true)
on conflict (name) do update set ativo = excluded.ativo;

insert into brands (name, ativo)
values ('Marca a definir', true)
on conflict (name) do update set ativo = true;

insert into products (name, brand_id, category_id, price, internal_cost, stock, description, ativo, disponivel, peso, volume, unidade)
select item.name, b.id, c.id, 0, 0, 0, 'Produto base para montagem de cestas, kits e fardos.', true, true, item.peso, item.volume, item.unidade
from (
  values
    ('Arroz', '5kg', null, 'Pacote'),
    ('Feijão', '1kg', null, 'Pacote'),
    ('Macarrão', '500g', null, 'Pacote'),
    ('Flocão', '500g', null, 'Pacote'),
    ('Óleo', null, '900ml', 'Unidade'),
    ('Molho de tomate', null, null, 'Unidade'),
    ('Vinagre', null, null, 'Unidade'),
    ('Leite em pó', null, null, 'Pacote'),
    ('Sal', '1kg', null, 'Pacote'),
    ('Bolacha', null, null, 'Pacote'),
    ('Café', null, null, 'Pacote'),
    ('Sardinha', null, null, 'Lata'),
    ('Creme dental', null, null, 'Unidade'),
    ('Sabonete', null, null, 'Unidade'),
    ('Sabão em pó', null, null, 'Pacote'),
    ('Detergente', null, null, 'Unidade'),
    ('Desinfetante', null, null, 'Unidade'),
    ('Amaciante', null, null, 'Unidade'),
    ('Água sanitária', null, null, 'Unidade'),
    ('Esponja', null, null, 'Unidade'),
    ('Açúcar', '1kg', null, 'Pacote'),
    ('Farinha mandioca', null, null, 'Pacote'),
    ('Papel higiênico', null, null, 'Pacote'),
    ('Refresco em pó', null, null, 'Unidade'),
    ('Macarrão instantâneo', null, null, 'Unidade'),
    ('Água sem gás', null, null, 'Fardo'),
    ('Água com gás', null, null, 'Fardo'),
    ('Refrigerante', null, null, 'Fardo'),
    ('Suco', null, null, 'Fardo'),
    ('Kapo', null, null, 'Unidade'),
    ('Nescau', null, null, 'Unidade'),
    ('Fandangos', null, null, 'Unidade'),
    ('Bolinho Bauducco', null, null, 'Unidade'),
    ('Wafer', null, null, 'Unidade'),
    ('Treloso', null, null, 'Unidade')
) as item(name, peso, volume, unidade)
cross join brands b
cross join categories c
where b.name = 'Marca a definir'
  and c.name = 'Produtos Gerais'
  and not exists (select 1 from products p where lower(p.name) = lower(item.name));

update products p
set category = c.name
from categories c
where p.category_id = c.id
  and (p.category is null or p.category = '');

insert into baskets (name, description, price, tipo, ativo)
values
  ('Cesta Prática', 'Cesta básica prática para compras recorrentes.', 89.99, 'CESTA_PRATICA', true),
  ('Cesta Completa', 'Cesta completa com alimentos e itens de higiene.', 139.99, 'CESTA_COMPLETA', true),
  ('Cestão Família', 'Cesta reforçada para famílias maiores.', 0, 'CESTAO_FAMILIA', true),
  ('Cesta Personalizada', 'Monte sua cesta com no mínimo 25 itens.', 0, 'CESTA_PERSONALIZADA', true)
on conflict do nothing;

do $$
declare
  cesta_pratica uuid;
  cesta_completa uuid;
  cestao_familia uuid;
begin
  select id into cesta_pratica from baskets where name = 'Cesta Prática' limit 1;
  select id into cesta_completa from baskets where name = 'Cesta Completa' limit 1;
  select id into cestao_familia from baskets where name = 'Cestão Família' limit 1;

  insert into basket_items (basket_id, product_id, quantity, is_customizable)
  select cesta_pratica, p.id, item.qty, true
  from (values
    ('Arroz', 3), ('Flocão', 4), ('Café', 1), ('Macarrão', 2), ('Sal', 1),
    ('Feijão', 2), ('Bolacha', 2), ('Refresco em pó', 2), ('Óleo', 1), ('Macarrão instantâneo', 2)
  ) item(name, qty)
  join products p on lower(p.name) = lower(item.name)
  where cesta_pratica is not null
  on conflict (basket_id, product_id) do update set quantity = excluded.quantity;

  insert into basket_items (basket_id, product_id, quantity, is_customizable)
  select cesta_completa, p.id, item.qty, true
  from (values
    ('Feijão', 2), ('Arroz', 4), ('Açúcar', 3), ('Macarrão', 2), ('Café', 1),
    ('Óleo', 1), ('Farinha mandioca', 1), ('Sal', 1), ('Flocão', 4), ('Bolacha', 2),
    ('Macarrão instantâneo', 2), ('Sabão em pó', 1), ('Creme dental', 1),
    ('Papel higiênico', 1), ('Sabonete', 2), ('Água sanitária', 1), ('Desinfetante', 1)
  ) item(name, qty)
  join products p on lower(p.name) = lower(item.name)
  where cesta_completa is not null
  on conflict (basket_id, product_id) do update set quantity = excluded.quantity;

  insert into basket_items (basket_id, product_id, quantity, is_customizable)
  select cestao_familia, p.id, item.qty, true
  from (values
    ('Arroz', 1), ('Feijão', 4), ('Flocão', 4), ('Café', 3), ('Óleo', 2),
    ('Macarrão', 4), ('Açúcar', 4), ('Bolacha', 1), ('Sardinha', 3), ('Sal', 1),
    ('Vinagre', 1), ('Refresco em pó', 3)
  ) item(name, qty)
  join products p on lower(p.name) = lower(item.name)
  where cestao_familia is not null
  on conflict (basket_id, product_id) do update set quantity = excluded.quantity;
end $$;
