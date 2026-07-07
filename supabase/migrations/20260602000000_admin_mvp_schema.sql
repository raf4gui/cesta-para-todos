alter table brands
add column if not exists ativo boolean not null default true;

alter table baskets
add column if not exists ativo boolean not null default true,
add column if not exists tipo text not null default 'CESTA_PRONTA'
  check (tipo in ('CESTA_PRONTA', 'CESTA_PERSONALIZAVEL'));

alter table products
add column if not exists category text,
add column if not exists disponivel boolean not null default true;

create table if not exists basket_item_brands (
  basket_id uuid not null references baskets(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  primary key (basket_id, product_id, brand_id)
);

alter table orders
add column if not exists payment_status text not null default 'PENDENTE'
  check (payment_status in ('PENDENTE', 'CONFIRMADO', 'CANCELADO')),
add column if not exists payment_confirmed_at timestamp with time zone,
add column if not exists delivered_at timestamp with time zone,
add column if not exists canceled_at timestamp with time zone;

create table if not exists store_settings (
  id boolean primary key default true check (id = true),
  whatsapp_phone text not null default '5574999581805',
  support_email text not null default 'suporte@cestaparatodos.com',
  address_line text not null default 'Carnaíba de Baixo',
  city_state text not null default 'Pindobaçu - Bahia',
  hero_image_url text,
  hero_title text not null default 'Cesta básica personalizada, pronta para pedir pelo celular.',
  hero_subtitle text not null default 'Escolha a cesta, informe as marcas de preferência e fale direto com a loja para combinar entrega em Pindobaçu e região.',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into store_settings (id)
values (true)
on conflict (id) do nothing;
