# Design — Login real + segurança "só logado" (app real do Gabinete)

**Data:** 2026-06-10
**Repo:** `gabinete-demo-real` (= app `gabinete-demo.vercel.app`; banco demo `yemlhsidmlxzpqimewox`)
**Stack:** React 19 + Vite + Supabase (Auth + Postgres) — JS (`.jsx`)

## Contexto / problema

O app real usa **login de mentirinha** (senhas compartilhadas: Candidato `demo2026`, Equipe `equipe2026`, ADM via tabela `admins`) e lia os dados pela **porta aberta** (acesso anônimo). Esse acesso anônimo foi **fechado** (lockdown LGPD em 2026-06-10), então o app mostra 0 dados.

Modelo de venda: **um app + um banco por cliente** (cada gabinete isolado por ter seu próprio Supabase). Logo, não precisa de multi-tenant por linha — precisa de **login de verdade** + RLS que libere **só quem está logado**.

## Objetivo

1. Trocar o login fake por **Supabase Auth (e-mail/senha)**.
2. RLS: dados acessíveis **apenas para usuários autenticados** (qualquer conta válida daquele banco). Público (anon) continua sem acesso.
3. Manter os **papéis** (candidato/adm/equipe) e a aparência/telas atuais.
4. A super-admin (Andressa) cria as contas de cada cliente.

## Modelo de dados

Tabela `public.membros` (já existe no demo): usar `user_id` (→ auth.users) + `papel` (`candidato` | `adm` | `equipe`) + `nome`. (A coluna `gabinete_id` fica sem uso neste modelo — não atrapalha.)

## Segurança (RLS)

Em cada tabela de dados, substituir a política multi-tenant por uma simples:
```sql
create policy acesso_logado on public.<tabela> for all to authenticated
  using (true) with check (true);
```
Resultado: qualquer usuário **logado** lê/escreve; **anon** não acessa nada (lockdown mantido). `membros` mantém `select` da própria linha.

> Ajuste no demo: remover as policies `tenant_isolation` (que exigiam `meu_gabinete()`) e o trigger `set_gabinete_id` das tabelas, e aplicar `acesso_logado`.

## Frontend (no app real)

- **`src/lib/supabase.js`**: já cria o client com a chave pública. (Adicionar `auth: { persistSession: true }` se necessário — padrão já persiste.)
- **`src/components/LoginScreen.jsx`**: substituir a escolha de perfil + senha compartilhada por **e-mail + senha** (`supabase.auth.signInWithPassword`). Após login, segue o fluxo.
- **`src/App.jsx`**: usar **sessão real** do Supabase (`getSession` + `onAuthStateChange`) no lugar do `localStorage` fake. Após autenticar, carregar o `papel` do usuário em `membros` e passar como `perfil` ao `Dashboard` (mantém a assinatura atual do Dashboard). Logout = `supabase.auth.signOut()`.
- As rotas públicas existentes (`#/m/...` visualizar mídia, `#/cadastro/...` cadastro público) **continuam acessíveis sem login** — mas dependem de tabelas hoje trancadas; tratadas como exceção controlada (ver "Pendências").

## Criação de contas

A Andressa cria as contas no painel do Supabase (Authentication → Add user, com Auto Confirm) e o papel é definido em `membros`. Conta de teste do demo: papel `candidato`.

## Onde / rollout

Construir e testar no **demo** (`gabinete-demo-real` → banco demo). Depois **replicar** no app `-digital` (banco 2026) e **migrar** (os dados reais já existem; só precisam de RLS `acesso_logado` + contas reais).

## Critérios de sucesso

- Usuário entra com e-mail/senha reais; sem login não acessa.
- App volta a mostrar os dados (para quem está logado).
- Anônimo (sem login) não lê nada (teste externo retorna vazio).
- Papel do usuário controla as telas como antes.

## Pendências / fora de escopo

- **Rotas públicas** (`VisualizarMidia`, `CadastroPublico`): precisam de políticas específicas (ex.: acesso anônimo restrito a 1 registro por token) — tratar depois, com cuidado, sem reabrir tudo.
- Tela bonita de gestão de usuários (hoje via painel Supabase).
- Assinatura/Mercado Pago — fase futura.
- Faxina dos `fix_*.cjs` na raiz do repo.
