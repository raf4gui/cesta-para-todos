-- Allow deleting customers who have orders by making customer_id nullable with SET NULL

alter table orders drop constraint orders_customer_id_fkey;
alter table orders alter column customer_id drop not null;
alter table orders add constraint orders_customer_id_fkey foreign key (customer_id) references customers(id) on delete set null;
