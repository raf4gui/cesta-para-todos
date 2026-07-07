-- AUDIT: Current state
SELECT '--- BASKETS ---' as info;
SELECT id, name, tipo FROM baskets ORDER BY name;

SELECT '--- CUSTOMERS ---' as info;
SELECT id, name, phone FROM customers ORDER BY name;

SELECT '--- ORDERS ---' as info;
SELECT id, protocol, status, customer_id, total_value FROM orders ORDER BY created_at DESC LIMIT 10;

SELECT '--- STOCK_MOVEMENTS ---' as info;
SELECT count(*) as total FROM stock_movements;

SELECT '--- FINANCIAL_ENTRIES ---' as info;
SELECT count(*) as total FROM financial_entries;

SELECT '--- NFE_EMISSIONS ---' as info;
SELECT count(*) as total FROM nfe_emissions;

SELECT '--- PROTOCOL SEQUENCE ---' as info;
SELECT last_value FROM order_protocol_seq;

SELECT '--- PRODUCT_IDS_IN_BASKET_ITEMS ---' as info;
SELECT DISTINCT p.name FROM basket_items bi JOIN products p ON bi.product_id = p.id;
