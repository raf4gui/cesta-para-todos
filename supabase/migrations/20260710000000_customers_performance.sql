-- Migration: 20260710000000_customers_performance.sql
-- Description: Performance indexes for customers table

-- B-tree index for sorting by creation date (used in pagination default sort)
create index if not exists idx_customers_created_at on customers(created_at desc);

-- Index for last_purchase_date sorting and filtering
create index if not exists idx_customers_last_purchase_date on customers(last_purchase_date desc);

-- Composite index for active filter + name search
create index if not exists idx_customers_ativo_name on customers(ativo, name);

-- Index for phone lookups (besides the unique constraint)
create index if not exists idx_customers_phone on customers(phone);

-- Index for city filtering
create index if not exists idx_customers_city on customers(city);

-- Index for total_spent sorting (high-value customers)
create index if not exists idx_customers_total_spent on customers(total_spent desc);

-- Index for purchase_count sorting (most purchases)
create index if not exists idx_customers_purchase_count on customers(purchase_count desc);

-- GIN trigram indexes for fuzzy search (already exist, kept for reference)
-- create index if not exists idx_customers_name_gin on customers using gin(name gin_trgm_ops);
-- create index if not exists idx_customers_phone_gin on customers using gin(phone gin_trgm_ops);
