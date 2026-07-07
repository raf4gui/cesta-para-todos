-- System Cleanup: removes all operational data, preserves structure and master data.
-- Safe to re-run. Idempotent.

-- 1. Delete operational data in dependency order
delete from order_notes;
delete from order_status_history;
delete from order_items;
delete from nfe_emissions;
delete from contas_receber;
delete from orders;
delete from customers;
delete from stock_movements;
delete from financial_entries;
delete from financial_alerts;
delete from recurring_expenses;
delete from admin_notes;
delete from report_cache;

-- 2. Reset sequences
alter sequence order_protocol_seq restart with 1;

-- 3. Reset NFe config numbers
update nfe_config set ultimo_numero_nfe = 0, ultimo_numero_nfce = 0 where id = true;

-- 4. Zero out product stock
update products set stock = 0;
