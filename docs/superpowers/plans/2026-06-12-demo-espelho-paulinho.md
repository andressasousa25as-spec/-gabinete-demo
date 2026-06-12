# Demo Espelho do Paulinho — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o app demo (`gabinete-demo.vercel.app`) pelo código do app do Paulinho rebrandeado como "Deputado Demo", apontando pro banco Supabase demo, com banco migrado pro modelo `perfis_usuarios`.

**Architecture:** Cópia integral do código-fonte de `C:\Projetos\gabinete-digital-novo\gabinete-digital` (ORIGEM) para `C:\Projetos\gabinete-demo-real` (DESTINO, repo `-gabinete-demo`, branch default `master`), seguida de rebrand (Deputado Demo, sem Linktree, Instagram configurável via `config_candidato.instagram`) e migração do banco demo (`yemlhsidmlxzpqimewox`) para o schema/modelo de papéis do banco do Paulinho (`nhlidwbdjaapynbvyviy`).

**Tech Stack:** React 19 + Vite + Supabase (JS), Vitest, MCP Supabase (migrations + edge functions), Vercel (auto-deploy no push para `master`).

**Referências fixas:**
- ORIGEM = `C:\Projetos\gabinete-digital-novo\gabinete-digital`
- DESTINO = `C:\Projetos\gabinete-demo-real`
- Banco demo = projeto Supabase `yemlhsidmlxzpqimewox`
- Banco Paulinho (só leitura, para consultar definições) = `nhlidwbdjaapynbvyviy`
- NUNCA modificar a ORIGEM nem o banco do Paulinho.

---

### Task 1: Branch e cópia do código

**Files:** todo o `src/`, `index.html`, `package.json`, `vite.config.*`, `supabase/functions/` do DESTINO substituídos pelos da ORIGEM. **Não copiar:** `.env` (o do DESTINO aponta pro banco demo e deve ser mantido), `.git`, `docs/`, `public/paulinho-ramos.jpg`.

- [ ] **Step 1: Criar branch**
```bash
cd /c/Projetos/gabinete-demo-real && git checkout -b feat/espelho-paulinho
```

- [ ] **Step 2: Conferir o `.env` do DESTINO** (deve ter URL `https://yemlhsidmlxzpqimewox.supabase.co`). Guardar cópia: `cp .env /tmp/env-demo-backup`.

- [ ] **Step 3: Substituir código**
```bash
cd /c/Projetos/gabinete-demo-real
rm -rf src supabase/functions
cp -r /c/Projetos/gabinete-digital-novo/gabinete-digital/src ./src
mkdir -p supabase && cp -r /c/Projetos/gabinete-digital-novo/gabinete-digital/supabase/functions ./supabase/functions
cp /c/Projetos/gabinete-digital-novo/gabinete-digital/index.html ./index.html
cp /c/Projetos/gabinete-digital-novo/gabinete-digital/package.json ./package.json
cp /c/Projetos/gabinete-digital-novo/gabinete-digital/package-lock.json ./package-lock.json 2>/dev/null
cp /c/Projetos/gabinete-digital-novo/gabinete-digital/vite.config.* ./ 2>/dev/null
# public/: copiar tudo MENOS a foto do Paulinho
mkdir -p public && cp -r /c/Projetos/gabinete-digital-novo/gabinete-digital/public/. ./public/ 2>/dev/null
rm -f public/paulinho-ramos.jpg
git checkout -- .env 2>/dev/null; true
```
Conferir depois que `.env` continua o do demo (`grep yemlhsidmlxzpqimewox .env`).

- [ ] **Step 4: Ajustar `package.json`** — campo `"name"` para `"gabinete-demo"` (Edit tool).

- [ ] **Step 5: Instalar e buildar**
```bash
npm install && npm run build
```
Expected: build OK (ainda com marca Paulinho — rebrand vem nas próximas tasks).

- [ ] **Step 6: Rodar testes**
```bash
npx vitest run
```
Expected: todos os testes da ORIGEM passam (bairros, licenca, papeis, logAtividade — 17+).

- [ ] **Step 7: Commit**
```bash
git add -A && git commit -m "feat: substitui codigo pelo app real (base Paulinho)"
```

---

### Task 2: Rebrand "Deputado Demo"

**Files (Modify):** `src/App.jsx`, `src/CadastroPublico.jsx`, `src/GestaoMidias.jsx`, `src/LinkTracker.jsx`, `src/components/DashboardCandidato.jsx`, `src/components/DashboardADM.jsx`, `src/components/DashboardEquipe.jsx`, `src/components/LoginScreen.jsx`, `src/components/DisparoLink.jsx`, `index.html`.
**Não mexer:** `src/vereadores2024.js`, `src/candidatosTSE.js` e telas TSE (`CenarioMunicipal`, `AnaliseTerritorial`, `DiagnosticoEleitoral`, `MapaEleitoral`, `ProjecaoEstrategica`, `RadarOportunidade`, `CaminhoVitoria`) — ali "Paulinho Ramos" pode aparecer como dado TSE real; trocar SOMENTE labels de UI fixos do tipo "Gabinete Paulinho Ramos" se existirem em títulos de cabeçalho.

- [ ] **Step 1: Mapear ocorrências**
```bash
grep -rn "Paulinho\|paulinho\|pramos\|gabinete-asf" src/ index.html
```

- [ ] **Step 2: Substituições (Edit tool, arquivo a arquivo):**
  - `Paulinho Ramos` (nomes exibidos em header/título/relatório) → `Deputado Demo`
  - `Gabinete Paulinho Ramos 2026` / `Dep. Paulinho Ramos 2026` → `Gabinete Demo 2026`
  - `O Candidato a Dep. Estadual Paulinho Ramos compartilhou` (GestaoMidias) → `O Deputado Demo compartilhou`
  - `https://gabinete-asf.vercel.app` → `https://gabinete-demo.vercel.app` (DashboardEquipe link de cadastro, DisparoLink, GestaoMidias, LinkTracker e onde mais aparecer)
  - `<img src="/paulinho-ramos.jpg" ...>` no DashboardCandidato → avatar de inicial:
```jsx
<div style={{width:"clamp(60px,15vw,90px)",height:"clamp(60px,15vw,90px)",borderRadius:"50%",border:"3px solid #fbbf24",background:"#1e40af",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"clamp(24px,6vw,40px)",flexShrink:0}}>
  {(config?.nome || 'Deputado Demo')[0].toUpperCase()}
</div>
```
  - Header do DashboardCandidato: `<h1>` usa `{config?.nome || 'Deputado Demo'}` e o `<p>` de cargo usa `{config?.cargo || 'Deputado Estadual — AP'}` (config já é carregado de `config_candidato` nesse componente).
  - `index.html`: `<title>` → `Gabinete Demo`. Manter `lang="pt-BR" translate="no"`.

- [ ] **Step 3: Conferir que não sobrou marca**
```bash
grep -rn "gabinete-asf" src/ index.html   # deve retornar vazio
grep -rn "paulinho-ramos.jpg" src/        # deve retornar vazio
```

- [ ] **Step 4: Build + commit**
```bash
npm run build && git add -A && git commit -m "feat: rebrand Deputado Demo"
```

---

### Task 3: Remover Linktree

**Files (Modify):** `src/components/DashboardEquipe.jsx`, `src/components/DisparoLink.jsx`, `src/LinkTracker.jsx`, `src/AnalyticsMidias.jsx`.

- [ ] **Step 1:** `grep -rn "inktr" src/` para mapear.
- [ ] **Step 2:** DashboardEquipe: remover o bloco `<div>` inteiro do Linktree (o `<a href="https://linktr.ee/...">` + botão "Gerar links rastreados" do canal linktree). Mantém só o bloco Instagram.
- [ ] **Step 3:** LinkTracker: remover `linktree` do mapa de destinos (deixar só instagram — ver Task 4).
- [ ] **Step 4:** DisparoLink: se o componente recebe `canal` genérico, nada a fazer (só não será chamado com linktree); se houver referência fixa a linktree, remover.
- [ ] **Step 5:** AnalyticsMidias: remover labels/séries específicas de linktree se existirem (cliques antigos do canal continuam no banco mas não há série dedicada).
- [ ] **Step 6:** `grep -rn "inktr" src/` → vazio. Build + commit:
```bash
npm run build && git add -A && git commit -m "feat: remove Linktree do demo"
```

---

### Task 4: Instagram configurável (config_candidato.instagram)

**Files (Modify):** `src/components/DashboardCandidato.jsx` (modal ⚙️ Config), `src/components/DashboardEquipe.jsx`, `src/LinkTracker.jsx`.
O banco demo JÁ tem a coluna `config_candidato.instagram` (text). Nenhuma migração necessária aqui.

- [ ] **Step 1:** DashboardCandidato — no array de campos do modal Config (onde tem `{ label: 'Nome', key: 'nome' }` etc.), adicionar `{ label: 'Instagram (URL)', key: 'instagram' }`. Conferir que o save do modal grava todas as keys em `config_candidato` (segue o padrão existente).
- [ ] **Step 2:** DashboardEquipe — buscar config no mount (padrão já usado pelo MapaEleitores quando não recebe prop):
```jsx
const [config, setConfig] = useState(null);
useEffect(() => { supabase.from('config_candidato').select('*').limit(1).maybeSingle().then(({data}) => setConfig(data)); }, []);
```
O `<a>` do Instagram usa `href={config?.instagram || '#'}` e fica desabilitado visualmente (`opacity:0.5, pointerEvents:'none'`) quando `!config?.instagram`.
- [ ] **Step 3:** LinkTracker — destino do canal `instagram` deixa de ser fixo: buscar `config_candidato.instagram` antes do redirect; se vazio, redirecionar pra raiz do app.
- [ ] **Step 4:** Build + commit:
```bash
npm run build && git add -A && git commit -m "feat: instagram configuravel via config_candidato"
```

---

### Task 5: Migração do banco demo — schema sync aditivo

Tudo via MCP `apply_migration` no projeto `yemlhsidmlxzpqimewox`. **Aditivo: nunca dropar colunas de dados.**

- [ ] **Step 1: Gerar diff de colunas** — rodar `execute_sql` nos DOIS projetos:
```sql
select table_name, column_name, data_type from information_schema.columns
where table_schema='public' and table_name in
('eleitores','liderancas','anotacoes','midias','midias_cliques','reunioes','rastreamento_links','logs_atividades','config_candidato','licenca')
order by 1,2;
```
- [ ] **Step 2: Aplicar ALTERs aditivos no demo** — para cada coluna presente no Paulinho e ausente no demo: `alter table X add column if not exists Y <tipo>;`. Já confirmado que faltam (mínimo): `eleitores.tags text[]`, `eleitores.versao_termo text`, `eleitores.user_id uuid`, `eleitores.whatsapp text`, `eleitores.zona text`, `eleitores.secao text`, `eleitores.lideranca text`, `eleitores.status_voto text`, `eleitores.prioridade text`, `eleitores.demanda text`, `eleitores.observacao text`, `eleitores.ultimo_contato date`, `eleitores.confirmado boolean`, `eleitores.origem text`, `eleitores.uf varchar`, `eleitores.cep text`, `eleitores.numero text`, `eleitores.complemento text`, `eleitores.email text`, `eleitores.interesses text[]`, `eleitores.origem_cadastro text`, `eleitores.consentimento_aceito boolean`, `eleitores.data_opt_out timestamptz`, `rastreamento_links.lideranca_id uuid`, `logs_atividades.user_id uuid` — completar com o diff real do Step 1 (inclui `liderancas.*` etc.).
- [ ] **Step 3: Conferir** re-rodando o diff → nenhuma coluna do Paulinho ausente no demo.

---

### Task 6: Migração do banco demo — papéis, funções, view, RPCs

- [ ] **Step 1: Buscar definições reais no banco do Paulinho** (fonte da verdade; rodar no projeto `nhlidwbdjaapynbvyviy`):
```sql
select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('eh_master','licenca_valida','registrar_clique_midia','registrar_clique_link');
select pg_get_viewdef('public.vw_mapa_eleitores', true);
select polname, pg_get_expr(polqual, polrelid) from pg_policy; -- p/ replicar políticas
```
- [ ] **Step 2: Criar `perfis_usuarios` no demo** (apply_migration `perfis_usuarios`):
```sql
create table if not exists public.perfis_usuarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  nome text, email text, perfil text check (perfil in ('MASTER','CANDIDATO','ADM','EQUIPE')),
  ativo boolean default true, created_at timestamptz default now());
alter table public.perfis_usuarios enable row level security;
create policy perfis_select_proprio on public.perfis_usuarios for select to authenticated
  using (user_id = auth.uid() or public.eh_master());
create policy perfis_master_manage on public.perfis_usuarios for all to authenticated
  using (public.eh_master()) with check (public.eh_master());
```
- [ ] **Step 3: Recriar `eh_master()`** com a definição do Paulinho (lê `perfis_usuarios.perfil='MASTER'` do `auth.uid()`); usar `create or replace`. Manter `licenca_valida()` (já existe; conferir igual à do Paulinho).
- [ ] **Step 4: RPCs** — `create or replace` de `registrar_clique_midia` e `registrar_clique_link` com as definições do Paulinho (SECURITY DEFINER) + `grant execute ... to anon, authenticated`.
- [ ] **Step 5: View** — recriar `vw_mapa_eleitores` com a definição do Paulinho (`security_invoker`, coalesce endereco/logradouro e municipio/cidade, flag liderança).
- [ ] **Step 6: logs_atividades** — replicar RLS do Paulinho: drop políticas atuais; `logs_select_master` (select se eh_master), `logs_insert_logado` (insert a authenticated); sem update/delete. `truncate table logs_atividades;` (histórico antigo é do sistema legado).
- [ ] **Step 7: Políticas anon das rotas públicas** — replicar as do Paulinho (insert em `eleitores`, insert+select em `liderancas` conforme nomes/expressões obtidas no Step 1). Remover políticas anon que o Paulinho não tem.
- [ ] **Step 8: Portão acesso_logado** — conferir que toda tabela usada pelo app tem política `for all to authenticated using (licenca_valida() ou eh_master())` no padrão do Paulinho; criar nas que faltarem (`rastreamento_links`, `perfis_usuarios` já coberta no Step 2).

---

### Task 7: Migração do banco demo — aposentar multi-tenant e legado

- [ ] **Step 1 (apply_migration `drop_multitenant`):**
```sql
drop trigger if exists trg_set_gabinete_id on public.eleitores;
-- repetir p/ todas as tabelas que tenham o trigger (listar com: select tgname, tgrelid::regclass from pg_trigger where tgname like '%gabinete%');
drop function if exists public.set_gabinete_id() cascade;
drop function if exists public.meu_gabinete() cascade;
drop function if exists public.eh_super_admin() cascade;
drop table if exists public.membros cascade;
drop table if exists public.gabinetes cascade;
drop table if exists public.admins cascade;
```
Antes de rodar: `select count(*) from membros;` e conferir com `pg_policies` que nenhuma política restante referencia `meu_gabinete`/`membros` (o cascade derruba as que referenciam — recriar depois se alguma tabela ficar sem política de acesso, usando o padrão do Paulinho).
- [ ] **Step 2:** Conferir edge function antiga `admin-gabinete` no demo (list_edge_functions) — pode ficar (não chamada pelo app novo), não deletar nada via dashboard.

---

### Task 8: Contas Auth do demo

Contas existentes: `gabinetedigitaldigitalsf@gmail.com` (vira EQUIPE), `assessora@teste.com` (vira CANDIDATO demo), `assessorb@teste.com` (vira ADM demo). Master = conta nova `andressa.sousa.25.as@gmail.com`.

- [ ] **Step 1: Renomear/resetar contas de teste via SQL** (execute_sql no demo):
```sql
update auth.users set email='candidato@gabinetedemo.com.br',
  encrypted_password=crypt('Candidato@Demo1', gen_salt('bf')), email_confirmed_at=now()
  where email='assessora@teste.com';
update auth.users set email='adm@gabinetedemo.com.br',
  encrypted_password=crypt('Adm@Demo1', gen_salt('bf')), email_confirmed_at=now()
  where email='assessorb@teste.com';
update auth.users set encrypted_password=crypt('Equipe@Demo1', gen_salt('bf'))
  where email='gabinetedigitaldigitalsf@gmail.com';
```
- [ ] **Step 2: Criar a conta master** — inserir via SQL no padrão Supabase:
```sql
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
 'andressa.sousa.25.as@gmail.com', crypt('Master@Demo1', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email='andressa.sousa.25.as@gmail.com';
```
- [ ] **Step 3: Popular perfis_usuarios:**
```sql
insert into public.perfis_usuarios (user_id, nome, email, perfil, ativo)
select id, v.nome, u.email, v.perfil, true from auth.users u
join (values ('andressa.sousa.25.as@gmail.com','Andressa (Master)','MASTER'),
             ('candidato@gabinetedemo.com.br','Deputado Demo','CANDIDATO'),
             ('adm@gabinetedemo.com.br','ADM Demo','ADM'),
             ('gabinetedigitaldigitalsf@gmail.com','Equipe Demo','EQUIPE')) as v(email,nome,perfil)
  on v.email = u.email
on conflict (user_id) do update set perfil=excluded.perfil, ativo=true;
```
- [ ] **Step 4: Validar login via API REST** (curl `POST /auth/v1/token?grant_type=password` com anon key do `.env`) para as 4 contas. Expected: token retornado para todas. Se o insert manual do master falhar no login, deletar a linha e usar convite por e-mail após a Task 11 (fallback documentado).

---

### Task 9: Edge function gerir-usuarios no demo

- [ ] **Step 1:** Ler o fonte em `supabase/functions/gerir-usuarios/index.ts` (copiado da ORIGEM na Task 1).
- [ ] **Step 2:** Deploy via MCP `deploy_edge_function` no projeto demo (mesmo nome `gerir-usuarios`, `verify_jwt` igual à do Paulinho — conferir com `get_edge_function` no projeto do Paulinho).
- [ ] **Step 3:** Smoke test: chamar a function com token do master (ação listar, se existir) ou validar pelo app na Task 12.

---

### Task 10: Completar dados fictícios

- [ ] **Step 1: Licença ativa:** `update licenca set status='ativo', validade='2027-12-31';`
- [ ] **Step 2: Espelho de lideranças em eleitores** (padrão Paulinho — liderança sempre tem registro espelho):
```sql
insert into eleitores (nome, telefone, bairro, municipio, endereco, lideranca_id, tags, ativo, consentimento_lgpd)
select l.nome, l.telefone, l.bairro, coalesce(l.municipio,'Macapa'), l.endereco, l.id, array['liderança'], true, true
from liderancas l
where not exists (select 1 from eleitores e where lower(e.nome)=lower(l.nome));
```
- [ ] **Step 3: Zona/seção fictícias onde faltar:** `update eleitores set zona_eleitoral=coalesce(zona_eleitoral,'10'), secao_eleitoral=coalesce(secao_eleitoral, (50+floor(random()*50))::text) where ativo;`
- [ ] **Step 4: Zerar coords inválidas pra re-geocodificação:** `update eleitores set latitude=null, longitude=null where latitude is not null and (latitude < -1 or latitude > 4.5 or longitude < -55 or longitude > -49.8);`
- [ ] **Step 5: Config do candidato demo:** garantir 1 linha em `config_candidato` com `nome='Deputado Demo'`, `cargo='Deputado Estadual'`, `estado='AP'`, bairro/coords de um centroide de Macapá (ex. Central `0.0349,-51.0556`), `instagram=null`, `foto_url=null`.
- [ ] **Step 6:** Conferir contagens: `select count(*) from eleitores where ativo; select count(*) from liderancas;` — demo não pode abrir vazio.

---

### Task 11: Validação local completa

- [ ] **Step 1:** `npm run build && npx vitest run` — tudo verde.
- [ ] **Step 2:** `npm run dev` e validar com browser (Claude in Chrome ou manual):
  - Login com cada conta → painel certo (MASTER e CANDIDATO→DashboardCandidato com 👑 só no master; ADM→DashboardADM; EQUIPE→DashboardEquipe).
  - Master vê botão 👥 Usuários com os 4 logins listados.
  - Mapa abre, geocodifica e mostra pins (azul/vermelho/dourado).
  - Equipe: botão Instagram desabilitado (config.instagram vazio) e sem Linktree; "🔗 Link de cadastro" copia URL `gabinete-demo.vercel.app/#/cadastro`.
  - `#/cadastro` abre o CadastroPublico com abas Apoiador/Liderança sem login.
  - Anon sem login não vê dados (conferir via curl REST com anon key: `select` em eleitores → `[]`).
- [ ] **Step 3:** Corrigir o que falhar; commits pequenos.

---

### Task 12: Merge, push e produção

- [ ] **Step 1:**
```bash
git checkout master && git merge feat/espelho-paulinho && git push origin master
```
- [ ] **Step 2:** Acompanhar deploy na Vercel (projeto do repo `-gabinete-demo`) até READY.
- [ ] **Step 3:** Smoke test em `https://gabinete-demo.vercel.app`: login master + 1 outra conta, mapa, link de cadastro.
- [ ] **Step 4: Etapa guiada com a Andressa (painel Supabase do demo):**
  - Auth → Configuração de URL: Site URL = `https://gabinete-demo.vercel.app`, redirect `https://gabinete-demo.vercel.app/**`.
  - Auth → E-mails → SMTP: mesmas credenciais Brevo do Paulinho (host `smtp-relay.brevo.com`, porta 587, user `ae6e3a001@smtp-brevo.com`, sender `nao-responda@gabinetedigitalsf.com.br`).
  - Testar "Criar/redefinir senha" no app demo.
- [ ] **Step 5:** Atualizar memória do projeto (gabinete-digital.md) com o novo estado do demo e as contas.
