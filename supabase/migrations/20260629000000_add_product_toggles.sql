-- ==========================================
-- Migration: Add toggle columns to products
-- Fields: show_price, allow_personalization, featured
-- ==========================================

alter table products
add column if not exists show_price boolean not null default true,
add column if not exists allow_personalization boolean not null default false,
add column if not exists featured boolean not null default false;

-- Sync existing products: enable show_price for all active products
update products set show_price = true where show_price is null;
update products set allow_personalization = false where allow_personalization is null;
update products set featured = false where featured is null;
