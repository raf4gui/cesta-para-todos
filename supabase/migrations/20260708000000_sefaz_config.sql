-- ==========================================
-- Migration: Add SEFAZ config columns + print_show_qrcode
-- ==========================================

alter table nfe_config
add column if not exists sefaz_uf text,
add column if not exists sefaz_ambiente text not null default 'homologacao',
add column if not exists sefaz_certificado text,
add column if not exists sefaz_certificado_senha text;

alter table store_settings
add column if not exists print_show_qrcode boolean not null default true;
