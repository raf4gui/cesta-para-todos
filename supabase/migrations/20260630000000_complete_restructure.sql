-- Migration: 20260630000000_complete_restructure.sql
-- Description: Complete restructure — proper categories, KIT/FARDO tipos, product_brands integration

-- ==========================================
-- 1. ADD KIT AND FARDO TO BASKETS TIPO
-- ==========================================
alter table baskets drop constraint if exists baskets_tipo_check;
update baskets set tipo = 'CESTA_PRATICA' where tipo not in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA','KIT','FARDO');
alter table baskets add constraint baskets_tipo_check
  check (tipo in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA','KIT','FARDO'));

-- ==========================================
-- 2. PROPER CATEGORIES (Alimentos, Limpeza, Higiene, Bebidas, Fraldas, Outros)
-- ==========================================
-- Insert new categories
insert into categories (name, description, ativo) values
  ('Alimentos', 'Arroz, feijão, macarrão, óleo, café, açúcar, farinha, sal, bolacha, etc.', true),
  ('Limpeza', 'Sabão em pó, detergente, desinfetante, água sanitária, amaciante, esponja, etc.', true),
  ('Higiene', 'Creme dental, sabonete, papel higiênico, etc.', true),
  ('Bebidas', 'Refrigerante, suco, água, cerveja, etc.', true),
  ('Fraldas', 'Fraldas descartáveis, lenços umedecidos, pomadas, etc.', true),
  ('Outros', 'Produtos diversos que não se enquadram nas categorias anteriores', true)
on conflict (name) do nothing;

-- Migrate existing products to proper categories based on name matching
update products set category_id = (select id from categories where name = 'Alimentos' limit 1)
where category_id in (select id from categories where name in ('Cestas', 'Produtos Gerais', 'Kit Lanche', 'Kits Fraldas'))
  and lower(name) in ('arroz','feijão','macarrão','flocão','óleo','molho de tomate','vinagre','leite em pó','sal','bolacha','café','sardinha','açúcar','farinha mandioca','macarrão instantâneo','nescau','fandangos','bolinho bauducco','wafer','treloso','refresco em pó','milho de pipoca','fubá','farinha de trigo','doce de leite','goiabada','mel','achocolatado','tempero','caldo knorr','azeite','extrato de tomate','ervilha','milho verde');

update products set category_id = (select id from categories where name = 'Limpeza' limit 1)
where category_id in (select id from categories where name in ('Cestas', 'Produtos Gerais'))
  and lower(name) in ('sabão em pó','detergente','desinfetante','amaciante','água sanitária','esponja','sabão em barra','sabão líquido','multiuso','lustra móveis','saponáceo','palha de aço','cloro','álcool');

update products set category_id = (select id from categories where name = 'Higiene' limit 1)
where category_id in (select id from categories where name in ('Cestas', 'Produtos Gerais'))
  and lower(name) in ('creme dental','sabonete','papel higiênico','shampoo','condicionador','desodorante','absorvente','protetor solar','pente','escova dental','cotonete','álcool gel');

update products set category_id = (select id from categories where name = 'Bebidas' limit 1)
where category_id in (select id from categories where name in ('Cestas', 'Produtos Gerais', 'Fardos de Bebidas'))
  and lower(name) in ('refrigerante','suco','kapo','água sem gás','água com gás','cerveja','energético','leite','leite em caixa','iogurte');

update products set category_id = (select id from categories where name = 'Fraldas' limit 1)
where category_id in (select id from categories where name in ('Cestas', 'Kits Fraldas', 'Produtos Gerais'))
  and lower(name) in ('fralda','fraldas','lenço umedecido','pomada');

-- Products for old 'Fardos de Bebidas' → 'Bebidas'
update products set category_id = (select id from categories where name = 'Bebidas' limit 1)
where category_id in (select id from categories where name = 'Fardos de Bebidas');

-- Products for old 'Fardos de Alimentos' → 'Alimentos'
update products set category_id = (select id from categories where name = 'Alimentos' limit 1)
where category_id in (select id from categories where name = 'Fardos de Alimentos');

-- Products for old 'Kit Lanche' → 'Alimentos'
update products set category_id = (select id from categories where name = 'Alimentos' limit 1)
where category_id in (select id from categories where name = 'Kit Lanche');

-- Products for old 'Kits Fraldas' → 'Fraldas'
update products set category_id = (select id from categories where name = 'Fraldas' limit 1)
where category_id in (select id from categories where name = 'Kits Fraldas');

-- Any remaining products with old categories → 'Outros'
update products set category_id = (select id from categories where name = 'Outros' limit 1)
where category_id in (select id from categories where name in ('Cestas', 'Produtos Gerais', 'Fardos de Bebidas', 'Fardos de Alimentos', 'Kit Lanche', 'Kits Fraldas'));

-- ==========================================
-- 3. UPDATE CATEGORIES SEED (for new installs)
-- ==========================================
-- Delete old seed categories (they'll no longer be created)
delete from categories where name in ('Cestas', 'Fardos de Bebidas', 'Fardos de Alimentos', 'Kits Fraldas', 'Kit Lanche', 'Produtos Gerais');

-- ==========================================
-- 4. ADD BASKET TYPE INDICATOR COLUMNS
-- ==========================================
alter table baskets
add column if not exists category_id uuid references categories(id) on delete set null;

-- ==========================================
-- 5. ENSURE product_brands INDEXES
-- ==========================================
create index if not exists idx_product_brands_product on product_brands(product_id);
create index if not exists idx_product_brands_brand on product_brands(brand_id);

-- ==========================================
-- 6. FIX TRIGGER: stock movement on order status change
-- Needs to handle basket_items composition for baskets/kits/fardos
-- ==========================================
create or replace function handle_order_status_change()
returns trigger as $$
declare
  item record;
  is_old_operational boolean;
  is_new_operational boolean;
begin
  -- Register history
  insert into order_status_history (order_id, old_status, new_status)
  values (new.id, old.status, new.status);

  -- Define operational statuses (stock deduction)
  is_old_operational := old.status in ('PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO');
  is_new_operational := new.status in ('PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO');

  -- Non-operational → Operational: Deduct stock
  if is_new_operational and not is_old_operational then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      update products set stock = stock - item.quantity where id = item.product_id;
      if (select stock from products where id = item.product_id) < 0 then
        raise exception 'Produto % possui estoque insuficiente.', item.product_id;
      end if;
    end loop;

  -- Operational → Non-operational: Restore stock
  elsif not is_new_operational and is_old_operational then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      update products set stock = stock + item.quantity where id = item.product_id;
    end loop;
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
