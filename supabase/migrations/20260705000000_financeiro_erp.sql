-- Migration: 20260705000000_financeiro_erp.sql
-- Description: Financial ERP module — recurring expenses, alerts, enhanced contas_receber, dashboard function

-- ==========================================
-- 1. Recurring expenses
-- ==========================================
create table if not exists recurring_expenses (
  id uuid primary key default uuid_generate_v4(),
  nome text not null default '',
  categoria text not null default '',
  valor decimal(12,2) not null default 0,
  data_vencimento integer not null default 1,
  observacao text default '',
  forma_pagamento text default '',
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'cancelada')),
  frequencia text not null default 'mensal' check (frequencia in ('diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  ultima_geracao date,
  proxima_geracao date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table recurring_expenses enable row level security;
create policy "recurring_expenses all" on recurring_expenses for all using (true) with check (true);
create index if not exists idx_recurring_expenses_status on recurring_expenses(status);
create index if not exists idx_recurring_expenses_proxima on recurring_expenses(proxima_geracao);

-- Trigger: updated_at
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

-- ==========================================
-- 2. Financial alerts
-- ==========================================
create table if not exists financial_alerts (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null check (tipo in ('vencida', 'vence_hoje', 'vence_3dias', 'recorrente_gerada', 'estoque_baixo')),
  mensagem text not null default '',
  lida boolean not null default false,
  created_at timestamptz default now()
);

alter table financial_alerts enable row level security;
create policy "financial_alerts all" on financial_alerts for all using (true) with check (true);
create index if not exists idx_financial_alerts_lida on financial_alerts(lida);
create index if not exists idx_financial_alerts_tipo on financial_alerts(tipo);

-- ==========================================
-- 3. Enhanced contas_receber
-- ==========================================
alter table contas_receber add column if not exists forma_pagamento text default '';
alter table contas_receber add column if not exists cliente_nome text default '';

-- Add data_vencimento to financial_entries if not present (used by recurring trigger)
alter table financial_entries add column if not exists data_vencimento text default '';

-- ==========================================
-- 4. Trigger: auto-create financial entries from recurring expenses
-- ==========================================
create or replace function gerar_despesas_recorrentes()
returns void as $$
declare
  r record;
  nova_data date;
  dia integer;
begin
  for r in select * from recurring_expenses where status = 'ativa' and (proxima_geracao is null or proxima_geracao <= current_date) loop
    insert into financial_entries (entry_type, amount, category, description, due_date, payment_method, is_paid, data_vencimento)
    values ('DESPESA', r.valor, r.categoria, r.nome,
            r.proxima_geracao,
            r.forma_pagamento, false,
            to_char(r.proxima_geracao, 'YYYY-MM-DD'));

    dia := r.data_vencimento;
    if r.frequencia = 'diaria' then
      nova_data := r.proxima_geracao + interval '1 day';
    elsif r.frequencia = 'semanal' then
      nova_data := r.proxima_geracao + interval '7 days';
    elsif r.frequencia = 'quinzenal' then
      nova_data := r.proxima_geracao + interval '15 days';
    elsif r.frequencia = 'mensal' then
      nova_data := r.proxima_geracao + interval '1 month';
    elsif r.frequencia = 'bimestral' then
      nova_data := r.proxima_geracao + interval '2 months';
    elsif r.frequencia = 'trimestral' then
      nova_data := r.proxima_geracao + interval '3 months';
    elsif r.frequencia = 'semestral' then
      nova_data := r.proxima_geracao + interval '6 months';
    elsif r.frequencia = 'anual' then
      nova_data := r.proxima_geracao + interval '1 year';
    end if;

    if r.frequencia in ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') then
      nova_data := make_date(
        extract(year from nova_data)::int,
        extract(month from nova_data)::int,
        least(dia, extract(day from (date_trunc('month', nova_data) + interval '1 month - 1 day'))::int)
      );
    end if;

    update recurring_expenses set
      ultima_geracao = proxima_geracao,
      proxima_geracao = nova_data,
      updated_at = now()
    where id = r.id;

    insert into financial_alerts (tipo, mensagem)
    values ('recorrente_gerada', 'Despesa recorrente gerada: ' || r.nome || ' - R$ ' || r.valor::text);
  end loop;
end;
$$ language plpgsql;

-- ==========================================
-- 5. Dashboard function — consolidated financial metrics
-- ==========================================
create or replace function get_financial_dashboard()
returns jsonb as $$
declare
  result jsonb;
  v_receitas_mes numeric(12,2);
  v_despesas_mes numeric(12,2);
begin
  -- Receitas do mês (financial_entries)
  select coalesce(sum(amount), 0) into v_receitas_mes
  from financial_entries
  where entry_type = 'RECEITA'
    and is_paid = true
    and extract(year from created_at) = extract(year from current_date)
    and extract(month from created_at) = extract(month from current_date);

  -- Despesas do mês (financial_entries)
  select coalesce(sum(amount), 0) into v_despesas_mes
  from financial_entries
  where entry_type = 'DESPESA'
    and is_paid = true
    and extract(year from created_at) = extract(year from current_date)
    and extract(month from created_at) = extract(month from current_date);

  select jsonb_build_object(
    'receitasMes', v_receitas_mes,
    'despesasMes', v_despesas_mes,
    'lucroLiquido', v_receitas_mes - v_despesas_mes,

    'saldoDia', coalesce((select sum(case when entry_type = 'RECEITA' then amount else -amount end) from financial_entries where is_paid = true and (due_date = current_date or data_vencimento = to_char(current_date, 'YYYY-MM-DD'))), 0),
    'saldoSemana', coalesce((select sum(case when entry_type = 'RECEITA' then amount else -amount end) from financial_entries where is_paid = true and (due_date >= date_trunc('week', current_date) or data_vencimento >= to_char(date_trunc('week', current_date), 'YYYY-MM-DD'))), 0),
    'saldoMes', coalesce((select sum(case when entry_type = 'RECEITA' then amount else -amount end) from financial_entries where is_paid = true and (extract(year from due_date) = extract(year from current_date) and extract(month from due_date) = extract(month from current_date))), 0),
    'saldoAno', coalesce((select sum(case when entry_type = 'RECEITA' then amount else -amount end) from financial_entries where is_paid = true and extract(year from due_date) = extract(year from current_date)), 0),
    'saldoTotal', coalesce((select sum(case when entry_type = 'RECEITA' then amount else -amount end) from financial_entries where is_paid = true), 0),

    'entradasSaidas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'month', to_char(data, 'YYYY-MM'),
        'income', coalesce(rec, 0),
        'expense', coalesce(desp, 0)
      ) order by data)
      from (
        select generate_series(
          date_trunc('month', current_date - interval '5 months'),
          date_trunc('month', current_date),
          interval '1 month'
        )::date as data
      ) months
      left join lateral (
        select coalesce(sum(case when fe.entry_type = 'RECEITA' then fe.amount else 0 end), 0) as rec,
               coalesce(sum(case when fe.entry_type = 'DESPESA' then fe.amount else 0 end), 0) as desp
        from financial_entries fe
        where fe.is_paid = true
          and extract(year from fe.created_at) = extract(year from months.data)
          and extract(month from fe.created_at) = extract(month from months.data)
      ) on true
    ), '[]'::jsonb),

    'gastosPorCategoria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category', fe.category,
        'total', sum(fe.amount)
      ) order by sum(fe.amount) desc)
      from financial_entries fe
      where fe.entry_type = 'DESPESA'
        and fe.is_paid = true
        and fe.category is not null and fe.category != ''
        and extract(year from fe.created_at) = extract(year from current_date)
        and extract(month from fe.created_at) = extract(month from current_date)
      group by fe.category
    ), '[]'::jsonb),

    'receitaMensal', coalesce((
      select jsonb_agg(jsonb_build_object(
        'month', to_char(data, 'YYYY-MM'),
        'total', coalesce(rec, 0)
      ) order by data)
      from (
        select generate_series(
          date_trunc('month', current_date - interval '11 months'),
          date_trunc('month', current_date),
          interval '1 month'
        )::date as data
      ) months
      left join lateral (
        select sum(fe.amount) as rec
        from financial_entries fe
        where fe.entry_type = 'RECEITA'
          and fe.is_paid = true
          and extract(year from fe.created_at) = extract(year from months.data)
          and extract(month from fe.created_at) = extract(month from months.data)
      ) on true
    ), '[]'::jsonb),

    'alertasCount', coalesce((select count(*) from financial_alerts where lida = false), 0),

    'contasVencidas', coalesce((select count(*) from contas_receber where status = 'pendente' and data_vencimento < current_date), 0),
    'contasVencendoHoje', coalesce((select count(*) from contas_receber where status = 'pendente' and data_vencimento = current_date), 0),
    'contasVencendo3Dias', coalesce((select count(*) from contas_receber where status = 'pendente' and data_vencimento > current_date and data_vencimento <= current_date + interval '3 days'), 0),

    'despesasRecorrentesAtivas', coalesce((select count(*) from recurring_expenses where status = 'ativa'), 0)
  ) into result;

  return result;
end;
$$ language plpgsql;
