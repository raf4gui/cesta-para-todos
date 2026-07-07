create table if not exists recurring_expenses (
  id uuid primary key default uuid_generate_v4(),
  name text not null default '',
  category text default '',
  amount decimal(12,2) not null default 0,
  due_day integer not null default 1 check (due_day between 1 and 31),
  frequency text not null default 'mensal' check (frequency in ('mensal','semanal','quinzenal','bimestral','trimestral','semestral','anual')),
  status text not null default 'ativa' check (status in ('ativa','pausada','cancelada')),
  payment_method text default '',
  notes text default '',
  entry_type text not null default 'DESPESA' check (entry_type in ('DESPESA','CUSTO')),
  last_generated date,
  next_generation date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table recurring_expenses enable row level security;
create policy "recurring_expenses all" on recurring_expenses for all using (true) with check (true);

create index if not exists idx_recurring_expenses_status on recurring_expenses(status);
create index if not exists idx_recurring_expenses_due_day on recurring_expenses(due_day);

create or replace function update_recurring_expenses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_recurring_expenses_updated_at on recurring_expenses;
create trigger trg_recurring_expenses_updated_at
  before update on recurring_expenses
  for each row execute function update_recurring_expenses_updated_at();
