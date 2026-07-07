-- Migration: 20260602100000_correct_business_model.sql
-- Description: Correção de modelagem de negócio (campos adicionais e tipos de cestas/fardos/kits)

-- 1. Adicionar campos extras na tabela de produtos internos (products)
alter table products 
add column if not exists peso text,
add column if not exists volume text,
add column if not exists unidade text;

-- 2. Adicionar campos extras na tabela de cestas/fardos/kits (baskets)
alter table baskets 
add column if not exists brand_id uuid references brands(id) on delete set null,
add column if not exists quantidade_fardo integer;

-- 3. Atualizar a restrição de tipos de cestas/fardos/kits permitidos
alter table baskets drop constraint if exists baskets_tipo_check;

alter table baskets add constraint baskets_tipo_check 
  check (tipo in (
    'CESTA_PRATICA', 
    'CESTA_COMPLETA', 
    'CESTAO_FAMILIA', 
    'CESTA_PERSONALIZADA', 
    'FARDO_BEBIDAS', 
    'FARDO_ALIMENTOS', 
    'KIT_FRALDAS',
    'CESTA_PRONTA',
    'CESTA_PERSONALIZAVEL'
  ));
