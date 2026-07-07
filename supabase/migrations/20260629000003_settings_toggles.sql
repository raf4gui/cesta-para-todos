-- ==========================================
-- Migration: Add global visibility toggles
-- and WhatsApp message template
-- ==========================================

alter table store_settings
add column if not exists show_prices boolean not null default true,
add column if not exists show_stock boolean not null default true,
add column if not exists show_availability boolean not null default true,
add column if not exists whatsapp_message_template text;
