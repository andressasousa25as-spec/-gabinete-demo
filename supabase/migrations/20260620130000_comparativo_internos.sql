create table if not exists public.comparativo_internos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  nome text not null,
  eh_nosso boolean default false,
  votos int default 0,
  cargo_ultima text,
  abrangencia text default '—',
  confirmado boolean default false,
  risco text default 'BAIXO' check (risco in ('ALTISSIMO','ALTO','MEDIO','BAIXO')),
  observacao text,
  ordem int default 0
);

create or replace function public.update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_comparativo_updated_at on public.comparativo_internos;
create trigger trg_comparativo_updated_at before update on public.comparativo_internos
  for each row execute function public.update_updated_at();

alter table public.comparativo_internos enable row level security;
drop policy if exists acesso_logado on public.comparativo_internos;
create policy acesso_logado on public.comparativo_internos for all to authenticated
  using (public.licenca_valida() or public.eh_master())
  with check (public.licenca_valida() or public.eh_master());

-- Seed FICTÍCIO (demo público). O seed real fica apenas no banco/repo do Paulinho.
insert into public.comparativo_internos (nome, eh_nosso, votos, cargo_ultima, abrangencia, confirmado, risco, observacao, ordem) values
  ('Candidato Demo', true, 5000, 'Dep. Estadual 2022', 'Estado', true, 'BAIXO', 'Nosso candidato (referência) — dados fictícios de demonstração.', 0),
  ('Adversário A', false, 7200, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Exemplo: acima do nosso na mesma disputa.', 1),
  ('Adversário B', false, 6100, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Exemplo de ameaça direta.', 2),
  ('Adversário C', false, 4500, 'Dep. Estadual 2022', 'Estado', true, 'ALTO', 'Exemplo: encostado no nosso.', 3),
  ('Vereador Exemplo D', false, 2500, 'Vereador 2024', 'Município', true, 'MEDIO', 'Exemplo de base municipal.', 4),
  ('Vereador Exemplo E', false, 1500, 'Vereador 2024', 'Município', true, 'MEDIO', 'Exemplo de base municipal.', 5),
  ('Estreante Exemplo F', false, 0, 'Estreante', '—', false, 'BAIXO', 'Exemplo de estreante (editável).', 6),
  ('Estreante Exemplo G', false, 0, 'Estreante', '—', false, 'BAIXO', 'Exemplo de estreante (editável).', 7);
