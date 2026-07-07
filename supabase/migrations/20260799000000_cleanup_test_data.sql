-- ==========================================
-- CLEANUP DE DADOS DE TESTE PARA PRODUÇÃO
-- ==========================================
-- Executar no SQL Editor do Supabase.
-- Mantém: produtos, marcas, categorias, cestas,
--         fardos, imagens, configurações, admin.
-- ==========================================

-- 1. Desabilitar triggers que podem atrapalhar a deleção
alter table orders disable trigger trg_generate_order_protocol;
alter table orders disable trigger trg_handle_order_insert;
alter table orders disable trigger trg_handle_order_status_change;
alter table orders disable trigger trg_auto_create_contas_receber;

-- 2. Itens de pedido (FK → orders, products)
delete from order_items;

-- 3. Histórico de status (FK → orders)
delete from order_status_history;

-- 4. Notas de pedido (FK → orders)
delete from order_notes;

-- 5. Emissões NF-e (FK → orders)
delete from nfe_emissions;

-- 6. Contas a receber (FK → orders, customers)
delete from contas_receber;

-- 7. Lançamentos financeiros
delete from financial_entries;

-- 8. Despesas recorrentes e alertas
delete from recurring_expenses;
delete from financial_alerts;

-- 9. Cache de relatórios
delete from report_cache;

-- 10. Movimentações de estoque (FK → products)
delete from stock_movements;

-- 11. Pedidos (FK → customers, baskets)
delete from orders;

-- 12. Clientes
delete from customers;

-- 13. Notas administrativas
delete from admin_notes;

-- 14. Reabilitar triggers
alter table orders enable trigger trg_generate_order_protocol;
alter table orders enable trigger trg_handle_order_insert;
alter table orders enable trigger trg_handle_order_status_change;
alter table orders enable trigger trg_auto_create_contas_receber;

-- 15. Resetar sequência de protocolo
alter sequence order_protocol_seq restart with 1;

-- 16. Atualizar estatísticas
analyze;
