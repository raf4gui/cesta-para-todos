drop table if exists admin_notes cascade;

create table admin_notes (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null default '',
  descricao text not null default '',
  categoria text not null default '',
  prioridade text not null default 'normal',
  status text not null default 'pendente',
  data_limite timestamp with time zone,
  lembrete timestamp with time zone,
  concluida boolean not null default false,
  cor text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table admin_notes enable row level security;

create policy "admin_notes_all" on admin_notes
  using (true)
  with check (true);

create index idx_admin_notes_created_at on admin_notes(created_at desc);
create index idx_admin_notes_categoria on admin_notes(categoria);
create index idx_admin_notes_prioridade on admin_notes(prioridade);
create index idx_admin_notes_status on admin_notes(status);

create index idx_admin_notes_lembrete on admin_notes(lembrete)
  where lembrete is not null;

create index idx_admin_notes_concluida on admin_notes(concluida)
  where concluida = false;

create index idx_admin_notes_search on admin_notes
  using gin(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')));
