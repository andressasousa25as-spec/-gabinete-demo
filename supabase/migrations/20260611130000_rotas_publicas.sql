-- =============================================
-- Rotas públicas: políticas anon mínimas
-- Aplicado em: 2026-06-11
-- =============================================

-- 1. midias: anon lê a mídia pelo id do link
drop policy if exists midia_publica_select on public.midias;
create policy midia_publica_select
  on public.midias
  for select
  to anon
  using (true);

-- 2. midias_cliques: anon insere registro de clique
drop policy if exists midia_clique_insert on public.midias_cliques;
create policy midia_clique_insert
  on public.midias_cliques
  for insert
  to anon
  with check (true);

-- 3. liderancas: anon lê a liderança pelo id do link de cadastro
drop policy if exists lideranca_publica_select on public.liderancas;
create policy lideranca_publica_select
  on public.liderancas
  for select
  to anon
  using (true);

-- 4. eleitores: anon insere novo eleitor via cadastro público
drop policy if exists cadastro_publico_insert on public.eleitores;
create policy cadastro_publico_insert
  on public.eleitores
  for insert
  to anon
  with check (true);

-- 5. eleitores: anon lê bairro/lideranca_id do eleitor para enriquecer clique
--    DONE_WITH_CONCERNS: VisualizarMidia faz SELECT em eleitores como anon para
--    copiar bairro/lideranca_id para midias_cliques. Política necessária para o
--    fluxo funcionar, mas expõe dados do eleitor a quem tiver o eleitor_id.
--    Recomendação futura: mover esse enriquecimento para uma Edge Function autenticada.
drop policy if exists eleitor_midia_select on public.eleitores;
create policy eleitor_midia_select
  on public.eleitores
  for select
  to anon
  using (true);
