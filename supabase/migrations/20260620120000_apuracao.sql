create table if not exists public.apuracao_candidatos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  nome text not null,
  numero text,
  partido text,
  eh_nosso boolean default false,
  ordem int default 0
);

create table if not exists public.apuracao_secao (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  municipio text not null,
  zona text not null,
  secao text not null,
  votos jsonb not null default '{}'::jsonb,
  total_secao int,
  foto_url text,
  reportado_por uuid references auth.users(id) on delete set null,
  reportado_nome text,
  status text default 'ok' check (status in ('ok','conferir')),
  unique (municipio, zona, secao)
);
create index if not exists idx_apuracao_secao_local on public.apuracao_secao(municipio, zona, secao);

create or replace function public.update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_apuracao_updated_at on public.apuracao_secao;
create trigger trg_apuracao_updated_at before update on public.apuracao_secao
  for each row execute function public.update_updated_at();

alter table public.apuracao_candidatos enable row level security;
alter table public.apuracao_secao enable row level security;
drop policy if exists acesso_logado on public.apuracao_candidatos;
create policy acesso_logado on public.apuracao_candidatos for all to authenticated
  using (public.licenca_valida() or public.eh_master())
  with check (public.licenca_valida() or public.eh_master());
drop policy if exists acesso_logado on public.apuracao_secao;
create policy acesso_logado on public.apuracao_secao for all to authenticated
  using (public.licenca_valida() or public.eh_master())
  with check (public.licenca_valida() or public.eh_master());

-- Bucket de fotos dos boletins (criado via insert em storage.buckets na aplicação MCP).
insert into storage.buckets (id, name, public) values ('boletins','boletins', true)
on conflict (id) do nothing;
