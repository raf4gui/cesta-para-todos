-- Migration: 20260708000001_insert_brands_and_cleanup.sql
-- Description: Insert official brands and remove test data for production delivery

-- ==========================================
-- 1. INSERT BRANDS
-- ==========================================

-- Alimentos
insert into brands (name) values ('Tio João') on conflict (name) do nothing;
insert into brands (name) values ('Camil') on conflict (name) do nothing;
insert into brands (name) values ('Kicaldo') on conflict (name) do nothing;
insert into brands (name) values ('Urbano') on conflict (name) do nothing;
insert into brands (name) values ('Dona Benta') on conflict (name) do nothing;
insert into brands (name) values ('Renata') on conflict (name) do nothing;
insert into brands (name) values ('Fortaleza') on conflict (name) do nothing;
insert into brands (name) values ('Vitarella') on conflict (name) do nothing;
insert into brands (name) values ('Pilar') on conflict (name) do nothing;
insert into brands (name) values ('Yoki') on conflict (name) do nothing;
insert into brands (name) values ('Quero') on conflict (name) do nothing;
insert into brands (name) values ('Fugini') on conflict (name) do nothing;
insert into brands (name) values ('Predilecta') on conflict (name) do nothing;
insert into brands (name) values ('Elefante') on conflict (name) do nothing;
insert into brands (name) values ('Liza') on conflict (name) do nothing;
insert into brands (name) values ('Soya') on conflict (name) do nothing;
insert into brands (name) values ('Delícia') on conflict (name) do nothing;
insert into brands (name) values ('Qualy') on conflict (name) do nothing;
insert into brands (name) values ('Nestlé') on conflict (name) do nothing;
insert into brands (name) values ('Nescau') on conflict (name) do nothing;
insert into brands (name) values ('Toddy') on conflict (name) do nothing;
insert into brands (name) values ('Santa Clara') on conflict (name) do nothing;
insert into brands (name) values ('Maratá') on conflict (name) do nothing;
insert into brands (name) values ('Pilão') on conflict (name) do nothing;
insert into brands (name) values ('3 Corações') on conflict (name) do nothing;
insert into brands (name) values ('Melitta') on conflict (name) do nothing;
insert into brands (name) values ('Mabel') on conflict (name) do nothing;
insert into brands (name) values ('Bauducco') on conflict (name) do nothing;
insert into brands (name) values ('Piraquê') on conflict (name) do nothing;
insert into brands (name) values ('Adria') on conflict (name) do nothing;
insert into brands (name) values ('Marilan') on conflict (name) do nothing;

-- Higiene Pessoal
insert into brands (name) values ('Colgate') on conflict (name) do nothing;
insert into brands (name) values ('Oral-B') on conflict (name) do nothing;
insert into brands (name) values ('Closeup') on conflict (name) do nothing;
insert into brands (name) values ('Sorriso') on conflict (name) do nothing;
insert into brands (name) values ('Dove') on conflict (name) do nothing;
insert into brands (name) values ('Rexona') on conflict (name) do nothing;
insert into brands (name) values ('Nivea') on conflict (name) do nothing;
insert into brands (name) values ('Johnson''s') on conflict (name) do nothing;
insert into brands (name) values ('Palmolive') on conflict (name) do nothing;
insert into brands (name) values ('Lux') on conflict (name) do nothing;
insert into brands (name) values ('Seda') on conflict (name) do nothing;
insert into brands (name) values ('Pantene') on conflict (name) do nothing;
insert into brands (name) values ('Elseve') on conflict (name) do nothing;
insert into brands (name) values ('Monange') on conflict (name) do nothing;
insert into brands (name) values ('Bozzano') on conflict (name) do nothing;
insert into brands (name) values ('Gillette') on conflict (name) do nothing;
insert into brands (name) values ('Above') on conflict (name) do nothing;
insert into brands (name) values ('Giovanna Baby') on conflict (name) do nothing;

-- Limpeza
insert into brands (name) values ('Ypê') on conflict (name) do nothing;
insert into brands (name) values ('OMO') on conflict (name) do nothing;
insert into brands (name) values ('Brilhante') on conflict (name) do nothing;
insert into brands (name) values ('Tixan') on conflict (name) do nothing;
insert into brands (name) values ('Minuano') on conflict (name) do nothing;
insert into brands (name) values ('Limpol') on conflict (name) do nothing;
insert into brands (name) values ('Veja') on conflict (name) do nothing;
insert into brands (name) values ('Ajax') on conflict (name) do nothing;
insert into brands (name) values ('Bombril') on conflict (name) do nothing;
insert into brands (name) values ('Assolan') on conflict (name) do nothing;
insert into brands (name) values ('Uau') on conflict (name) do nothing;
insert into brands (name) values ('Pinho Sol') on conflict (name) do nothing;
insert into brands (name) values ('Casa & Perfume') on conflict (name) do nothing;
insert into brands (name) values ('Downy') on conflict (name) do nothing;
insert into brands (name) values ('Comfort') on conflict (name) do nothing;
insert into brands (name) values ('Qboa') on conflict (name) do nothing;
insert into brands (name) values ('Clorox') on conflict (name) do nothing;
insert into brands (name) values ('Harpic') on conflict (name) do nothing;

-- Papelaria e Utilidades
insert into brands (name) values ('Personal') on conflict (name) do nothing;
insert into brands (name) values ('Neve') on conflict (name) do nothing;
insert into brands (name) values ('Mili') on conflict (name) do nothing;
insert into brands (name) values ('Scott') on conflict (name) do nothing;
insert into brands (name) values ('Snob') on conflict (name) do nothing;
insert into brands (name) values ('Kitchen') on conflict (name) do nothing;
insert into brands (name) values ('Copobras') on conflict (name) do nothing;
insert into brands (name) values ('Wyda') on conflict (name) do nothing;

-- Fraldas e Bebês
insert into brands (name) values ('Pampers') on conflict (name) do nothing;
insert into brands (name) values ('Huggies') on conflict (name) do nothing;
insert into brands (name) values ('Turma da Mônica Baby') on conflict (name) do nothing;
insert into brands (name) values ('Personal Baby') on conflict (name) do nothing;
insert into brands (name) values ('Cremer') on conflict (name) do nothing;

-- ==========================================
-- 2. CLEAN UP TEST DATA
-- ==========================================

-- Delete test customer (Maria - no orders associated)
delete from customers where id = '9fe74acd-597f-4dfb-8545-6e9b16eb20f1';

-- ==========================================
-- 3. REFRESH SCHEMA CACHE
-- ==========================================

notify pgrst, 'reload schema';
