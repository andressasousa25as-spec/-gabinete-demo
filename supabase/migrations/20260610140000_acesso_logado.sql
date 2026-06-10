-- RLS "so logado": autenticado le/escreve tudo deste banco; anon bloqueado.
-- Modelo: um banco por cliente. Aplicado no demo (yemlhsidmlxzpqimewox) 2026-06-10.
do $$
declare r record;
begin
  for r in select c.relname from pg_class c
           join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
             and c.relname not in ('spatial_ref_sys','gabinetes','membros') loop
    execute format('alter table public.%I enable row level security', r.relname);
    execute format('drop policy if exists tenant_isolation on public.%I', r.relname);
    execute format('drop trigger if exists trg_set_gabinete on public.%I', r.relname);
    execute format('drop policy if exists acesso_logado on public.%I', r.relname);
    execute format('create policy acesso_logado on public.%I for all to authenticated using (true) with check (true)', r.relname);
  end loop;
end $$;
