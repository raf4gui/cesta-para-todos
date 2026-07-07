alter table products
add column if not exists ativo boolean not null default true;
