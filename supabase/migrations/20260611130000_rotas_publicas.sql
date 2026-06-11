-- =============================================
-- Rotas públicas: políticas anon mínimas + RPC security definer
-- Aplicado em: 2026-06-11 (revisto: sem anon SELECT em eleitores — LGPD)
-- =============================================

-- 1. liderancas: anon lê a liderança pelo id do link de cadastro
drop policy if exists lideranca_publica_select on public.liderancas;
create policy lideranca_publica_select
  on public.liderancas
  for select
  to anon
  using (true);

-- 2. eleitores: anon insere novo eleitor via cadastro público (insert-only, sem leitura)
drop policy if exists cadastro_publico_insert on public.eleitores;
create policy cadastro_publico_insert
  on public.eleitores
  for insert
  to anon
  with check (true);

-- 3. Políticas anon em midias e midias_cliques removidas — substituídas pela função abaixo
drop policy if exists midia_publica_select on public.midias;
drop policy if exists midia_clique_insert on public.midias_cliques;
-- Também garante remoção da política de leitura de eleitores que foi adicionada por engano
drop policy if exists eleitor_midia_select on public.eleitores;

-- 4. Função SECURITY DEFINER: anon chama RPC em vez de ler tabelas diretamente
--    Lê midias e eleitores internamente (como postgres), grava clique e devolve a URL.
--    Eleitor nunca fica exposto ao cliente anon.
create or replace function public.registrar_clique_midia(p_midia_id uuid, p_eleitor_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_url       text;
  v_bairro    text;
  v_lideranca uuid;
begin
  select arquivo_url into v_url from public.midias where id = p_midia_id;
  if v_url is null then return null; end if;
  select bairro, lideranca_id into v_bairro, v_lideranca
    from public.eleitores where id = p_eleitor_id;
  insert into public.midias_cliques (midia_id, eleitor_id, bairro, lideranca_id, data_clique)
  values (p_midia_id, p_eleitor_id, v_bairro, v_lideranca, now());
  return v_url;
end $$;

revoke all on function public.registrar_clique_midia(uuid, uuid) from public;
grant execute on function public.registrar_clique_midia(uuid, uuid) to anon;
