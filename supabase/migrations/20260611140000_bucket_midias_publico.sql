-- Mídias de campanha são materiais de divulgação (compartilhados no WhatsApp),
-- não dados de eleitor. O lockdown deixou o bucket privado, quebrando os links
-- públicos ("Bucket not found"). Aqui: bucket público (qualquer um VÊ a imagem),
-- mas só usuário autenticado pode subir/editar/apagar (anon perde escrita).

update storage.buckets set public = true where id = 'midias-campanha';

drop policy if exists "allow all" on storage.objects;

create policy "midias_auth_manage" on storage.objects for all to authenticated
  using (bucket_id = 'midias-campanha')
  with check (bucket_id = 'midias-campanha');
