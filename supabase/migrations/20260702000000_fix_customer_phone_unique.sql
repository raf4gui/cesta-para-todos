-- Migration: 20260702000000_fix_customer_phone_unique.sql
-- Description: Adds UNIQUE constraint on customers(phone) to prevent duplicate phone numbers
-- and prevent accidental customer overwrites. Cleans empty/null phones first.

-- Clean up any customers with empty/null phone before adding constraint
update customers set phone = 'SEM_TELEFONE_' || id::text where phone is null or phone = '';

-- Add UNIQUE constraint
alter table customers add constraint customers_phone_key unique (phone);

-- Create index for faster phone lookups
create index if not exists idx_customers_phone_unique on customers(phone);
