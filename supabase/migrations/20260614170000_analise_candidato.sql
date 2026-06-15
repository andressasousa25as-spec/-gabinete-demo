-- Análise eleitoral por candidato: 1 linha = o candidato dono do app.
create table if not exists public.analise_candidato (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  cargo text not null,
  nome text not null,
  partido text,
  numero text,
  total int not null default 0,
  municipios jsonb not null default '{}'::jsonb,
  zonas jsonb not null default '{}'::jsonb,
  secoes jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.analise_candidato enable row level security;
drop policy if exists analise_select_logado on public.analise_candidato;
create policy analise_select_logado on public.analise_candidato
  for select to authenticated using (true);
drop policy if exists analise_master_manage on public.analise_candidato;
create policy analise_master_manage on public.analise_candidato
  for all to authenticated using (public.eh_master()) with check (public.eh_master());
