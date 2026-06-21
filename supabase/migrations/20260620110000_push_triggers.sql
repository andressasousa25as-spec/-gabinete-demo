-- Gatilhos de notificação push.
-- Config (URL + chave da função) fica na tabela app_config, inserida por ambiente
-- via MCP/painel (não versionada aqui para não expor chaves).

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.app_config (
  chave text primary key,
  valor text
);
alter table public.app_config enable row level security;
-- sem policies: anon/authenticated não leem; funções security definer leem normalmente.

create or replace function public.disparar_push(titulo text, corpo text, url text, user_ids uuid[] default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  fn_url text;
  fn_key text;
begin
  select valor into fn_url from public.app_config where chave = 'send_push_url';
  select valor into fn_key from public.app_config where chave = 'send_push_key';
  if fn_url is null or fn_url = '' then return; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||fn_key),
    body := jsonb_build_object('titulo',titulo,'corpo',corpo,'url',url,'user_ids',to_jsonb(user_ids))
  );
end $$;

create or replace function public.trg_demanda_nova() returns trigger language plpgsql as $$
begin
  perform public.disparar_push('Nova demanda', coalesce(NEW.titulo,'Demanda registrada'), '/', null);
  return NEW;
end $$;
drop trigger if exists demanda_nova_push on public.demandas;
create trigger demanda_nova_push after insert on public.demandas
  for each row execute function public.trg_demanda_nova();


select cron.schedule('demandas-atrasadas', '0 12 * * *', $$
  select public.disparar_push('Demanda atrasada', titulo||' venceu o prazo', '/', null)
  from public.demandas
  where prazo < current_date and status not in ('Resolvida','Cancelada');
$$);

select cron.schedule('reunioes-lembrete', '0 * * * *', $$
  select public.disparar_push('Reuniao em breve', titulo||' as '||to_char(data,'DD/MM HH24:MI'), '/', null)
  from public.reunioes
  where data between now() and now() + interval '1 hour';
$$);
