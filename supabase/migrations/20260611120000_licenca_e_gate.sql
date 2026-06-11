-- Migration: licenca_e_gate
-- Creates the licenca singleton table, helper functions, sets master role,
-- and gates all data-table RLS policies behind licenca_valida() or eh_master().

create table if not exists public.licenca (
  id integer primary key default 1,
  status text not null default 'teste' check (status in ('teste','ativo','vencido')),
  validade date not null default (current_date + 7),
  plano text,
  atualizado_em timestamptz not null default now(),
  constraint licenca_singleton check (id = 1)
);

insert into public.licenca (id, status, validade)
values (1, 'teste', current_date + 7)
on conflict (id) do nothing;

create or replace function public.eh_master()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m
    where m.user_id = auth.uid() and m.papel = 'master'
  );
$$;

create or replace function public.licenca_valida()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.licenca l
    where l.id = 1 and l.status <> 'vencido' and l.validade >= current_date
  );
$$;

update public.membros m set papel = 'master'
from auth.users u
where m.user_id = u.id and u.email = 'gabinetedigitaldigitalsf@gmail.com';

alter table public.licenca enable row level security;
drop policy if exists licenca_select on public.licenca;
create policy licenca_select on public.licenca for select to authenticated using (true);
drop policy if exists licenca_update on public.licenca;
create policy licenca_update on public.licenca for update to authenticated
  using (public.eh_master()) with check (public.eh_master());

-- Reforce RLS on data tables: require valid licenca OR master role
do $$
declare t text;
begin
  foreach t in array array['eleitores','liderancas','reunioes','anotacoes','midias'] loop
    execute format('drop policy if exists acesso_logado on public.%I', t);
    execute format($f$
      create policy acesso_logado on public.%I for all to authenticated
      using (public.licenca_valida() or public.eh_master())
      with check (public.licenca_valida() or public.eh_master())
    $f$, t);
  end loop;
end $$;
