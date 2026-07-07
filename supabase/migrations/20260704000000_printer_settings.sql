alter table store_settings
add column if not exists printer_type text not null default 'a4' check (printer_type in ('a4', 'thermal_58mm', 'thermal_80mm')),
add column if not exists auto_print_order boolean not null default false,
add column if not exists print_show_logo boolean not null default true,
add column if not exists print_show_notes boolean not null default true,
add column if not exists print_show_phone boolean not null default true,
add column if not exists print_show_address boolean not null default true;
