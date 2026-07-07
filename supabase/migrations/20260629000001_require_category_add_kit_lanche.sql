-- ==========================================
-- Migration: Make category mandatory, add Kit Lanche
-- ==========================================

-- Insert Kit Lanche if not exists
insert into categories (name, description, ativo)
select 'Kit Lanche', 'Kits de lanches e merendas', true
where not exists (select 1 from categories where name = 'Kit Lanche');

-- Assign existing products with no category to "Produtos Gerais"
update products
set category_id = (select id from categories where name = 'Produtos Gerais' limit 1)
where category_id is null;

-- Make category_id NOT NULL
alter table products
alter column category_id set not null;
