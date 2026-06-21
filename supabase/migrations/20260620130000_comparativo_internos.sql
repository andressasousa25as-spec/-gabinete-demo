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

-- Seed dos 17 (nominata União Brasil 2026). Números confirmados = TSE; demais editáveis.
insert into public.comparativo_internos (nome, eh_nosso, votos, cargo_ultima, abrangencia, confirmado, risco, observacao, ordem) values
  ('Paulinho Ramos', true, 4880, 'Dep. Estadual 2022', 'Estado', true, 'BAIXO', 'Nosso candidato (referência).', 0),
  ('Roberto Góes', false, 6681, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Ex-prefeito; acima do Paulinho na mesma disputa.', 1),
  ('Rodolfo Vale', false, 5649, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Acima do Paulinho na disputa estadual.', 2),
  ('Jorge Amanajás', false, 5592, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Acima do Paulinho na disputa estadual.', 3),
  ('Aparecida Salomão', false, 4143, 'Dep. Estadual 2022', 'Estado', true, 'ALTO', 'Estadual encostada no Paulinho.', 4),
  ('Joselyo Mais Saúde', false, 2668, 'Vereador Macapá 2024', 'Município', true, 'ALTO', 'Vereador eleito; base municipal organizada.', 5),
  ('Faraó', false, 2413, 'Vereador Macapá 2024', 'Município', true, 'MEDIO', 'Base municipal relevante (UNIÃO).', 6),
  ('Alberto Negrão', false, 1803, 'Vereador Macapá 2024', 'Município', true, 'MEDIO', 'Base municipal.', 7),
  ('Engenheiro Ângelo', false, 1205, 'Vereador Macapá 2024', 'Município', true, 'MEDIO', 'Base municipal (UNIÃO).', 8),
  ('Samuel', false, 0, 'A confirmar', '—', false, 'MEDIO', 'A confirmar — NÃO é Josiel Alcolumbre; pode ser Samuel PDT vereador 2024 (3.088), não confirmado.', 9),
  ('Beth Pelaes', false, 0, 'Prefeita PBA 2021-2024', 'Município', false, 'ALTO', 'Ex-prefeita de Pedra Branca do Amapari (2 mandatos) + forte alcance digital. Voto 0 não significa risco baixo. Votos a confirmar no TSE.', 10),
  ('Bia Pombo', false, 0, 'Estreante', '—', false, 'BAIXO', 'Assistente social; sem histórico eleitoral medido.', 11),
  ('Ana Souza', false, 0, 'Estreante', '—', false, 'BAIXO', 'Esposa do prefeito de Vitória do Jari.', 12),
  ('Anderson Almeida', false, 0, 'Estreante', '—', false, 'BAIXO', 'Base em Santana (a confirmar).', 13),
  ('Roseli Matos', false, 0, 'Estreante', '—', false, 'BAIXO', 'A confirmar.', 14),
  ('Gracilene Barros', false, 0, 'Estreante', '—', false, 'BAIXO', 'A confirmar.', 15),
  ('Divino Rocha', false, 0, 'Prefeito Ferreira Gomes 2020 (cand.)', 'Município', false, 'MEDIO', 'Candidato a prefeito de Ferreira Gomes em 2020 (Progressistas). Base local, município pequeno (~7 mil eleitores) → peso estadual limitado. Votos a confirmar no TSE.', 16);
