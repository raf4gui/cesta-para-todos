-- Migration: 20260708000002_fardo_customization.sql
-- Description: Add available_sizes and available_quantities to basket_items for FARDO customization

alter table basket_items
add column if not exists available_sizes jsonb not null default '[]'::jsonb,
add column if not exists available_quantities jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
