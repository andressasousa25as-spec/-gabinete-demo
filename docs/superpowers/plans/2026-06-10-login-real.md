# Login real + RLS "só logado" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o login fake do app real do Gabinete por Supabase Auth (e-mail/senha) e liberar os dados apenas para usuários autenticados, fechando o vazamento e religando o app.

**Architecture:** Um banco por cliente. RLS de cada tabela passa a `for all to authenticated using(true)` (logado vê tudo daquele banco; anon não vê nada). O frontend usa sessão real do Supabase; o papel (candidato/adm/equipe) vem da tabela `membros`.

**Tech Stack:** React 19 + Vite (JSX) + Supabase (Auth + Postgres).

**Spec:** `docs/superpowers/specs/2026-06-10-login-real-design.md`

**Repo:** `C:\Projetos\gabinete-demo-real` (branch `feat/login-real`). Banco demo: `yemlhsidmlxzpqimewox` (migração via Supabase MCP pelo controlador).

---

## Task 1: RLS "só logado" no banco demo

**Aplicar via Supabase MCP `apply_migration(project_id='yemlhsidmlxzpqimewox', name='acesso_logado', query=<abaixo>)`.** Remove as políticas multi-tenant e o trigger, e aplica acesso para autenticados.

- [ ] **Step 1: Aplicar a migração**

```sql
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
```

- [ ] **Step 2: Verificar (controlador)** — `execute_sql`:
```sql
select count(*) filter (where polname='acesso_logado') as com_acesso_logado,
       count(*) filter (where polname='tenant_isolation') as ainda_tenant
from pg_policies pp join pg_policy p on true
where schemaname='public';
```
(Simplificado — alternativamente:)
```sql
select count(*) as politicas_acesso_logado from pg_policies where schemaname='public' and policyname='acesso_logado';
```
Expected: `politicas_acesso_logado >= 1`.

- [ ] **Step 3: Teste externo anônimo (deve continuar vazio)** — controlador roda curl com a chave pública do demo em `eleitores`. Expected: `[]` (anon segue bloqueado).

- [ ] **Step 4: Versionar e commitar**

Criar `supabase/migrations/20260610140000_acesso_logado.sql` com o SQL do Step 1:
```bash
git add supabase/migrations/20260610140000_acesso_logado.sql
git commit -m "feat(db): RLS acesso_logado (autenticado le tudo; anon bloqueado)"
```

---

## Task 2: Frontend — login real + sessão

**Files:** `.env` (criar/ajustar), `src/components/LoginScreen.jsx` (reescrever), `src/App.jsx` (reescrever auth).

- [ ] **Step 1: `.env` aponta pro demo** (controlador já tem a publishable key). Conteúdo:
```
VITE_SUPABASE_URL=https://yemlhsidmlxzpqimewox.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_3UTkOIsoInvzBU8d4RDzlA__AfL4xQ9
```

- [ ] **Step 2: Reescrever `src/components/LoginScreen.jsx`**

```jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ candidato }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return setErro('Preencha e-mail e senha.');
    setLoading(true); setErro('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('E-mail ou senha incorretos.');
    setLoading(false);
    // O App reage via onAuthStateChange; não precisa fazer mais nada aqui.
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>GABINETE DIGITAL</h1>
        <p style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>👑 {candidato || 'Candidato Demo'}</p>
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
        <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
        {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{erro}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: 13, borderRadius: 10, background: '#1e40af', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Sistema de Gestão Eleitoral 2026</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Reescrever `src/App.jsx`** (mantém rotas públicas; troca o auth fake por sessão real)

```jsx
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import VisualizarMidia from './components/VisualizarMidia';
import CadastroPublico from './components/CadastroPublico';
import { supabase } from './lib/supabase';

function App() {
  const [sessao, setSessao] = useState(null);
  const [papel, setPapel] = useState(null);
  const [membro, setMembro] = useState(null);
  const [candidato, setCandidato] = useState('');
  const [rotaMidia, setRotaMidia] = useState(null);
  const [rotaCadastro, setRotaCadastro] = useState(null);
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    const matchMidia = hash.match(/^#\/m\/([^/]+)\/([^/]+)/);
    if (matchMidia) { setRotaMidia({ midiaId: matchMidia[1], eleitorId: matchMidia[2] }); setIniciando(false); return; }
    const matchCadastro = hash.match(/^#\/cadastro\/([^/]+)/);
    if (matchCadastro) { setRotaCadastro({ liderancaId: matchCadastro[1] }); setIniciando(false); return; }

    const params = new URLSearchParams(window.location.search);
    setCandidato(params.get('candidato') || 'Candidato Demo');

    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setIniciando(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao?.user) { setPapel(null); setMembro(null); return; }
    supabase.from('membros').select('*').eq('user_id', sessao.user.id).maybeSingle()
      .then(({ data }) => { setMembro(data); setPapel(data?.papel || 'equipe'); });
  }, [sessao]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (iniciando) return null;
  if (rotaMidia) return <VisualizarMidia midiaId={rotaMidia.midiaId} eleitorId={rotaMidia.eleitorId} />;
  if (rotaCadastro) return <CadastroPublico liderancaId={rotaCadastro.liderancaId} />;
  if (!sessao) return <LoginScreen candidato={candidato} />;
  if (!papel) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Carregando...</div>;

  return (
    <Dashboard
      candidato={candidato}
      perfil={papel}
      admLogado={papel === 'adm' ? membro : null}
      onLogout={handleLogout}
    />
  );
}

export default App;
```

- [ ] **Step 4: Build** — `cd /c/Projetos/gabinete-demo-real && npm install && npm run build`. Expected: sucesso. (rodar `npm install` porque é um clone novo.)

- [ ] **Step 5: Commit** (`.env` é gitignored — não commitar):
```bash
git add src/App.jsx src/components/LoginScreen.jsx
git commit -m "feat(app): login real (Supabase Auth) e sessao no lugar do login fake"
```

---

## Task 3: Bootstrap da conta + teste manual (no demo)

- [ ] **Step 1: Criar a conta do candidato** — a Andressa cria no painel Supabase (Authentication → Add user → e-mail + senha + Auto Confirm). Depois o controlador define o papel:
```sql
insert into public.membros (user_id, gabinete_id, papel, nome)
select id, null, 'candidato', 'Candidato Demo' from auth.users where email = '<email-criado>'
on conflict (user_id) do update set papel = 'candidato';
```

- [ ] **Step 2: Rodar o app** — controlador roda `npm run dev` em background; abre `http://localhost:5173`.

- [ ] **Step 3: Teste manual**
- Login com o e-mail/senha criados → deve abrir o **Dashboard completo** (Mapa, Anotações, etc.).
- Os números/listas voltam a aparecer (dados do banco demo, agora acessíveis por estar logado).
- Adicionar um eleitor → aparece. Sair → volta pro login. Sem login → não acessa.
- Controlador confirma com teste externo anônimo: `eleitores` retorna `[]` (continua fechado pro público).

---

## Task 4: Replicar no app real `-digital` (banco 2026)

> Só após o demo validado.

- [ ] **Step 1: Clonar o repo `-digital`** — `git clone https://github.com/andressasousa25as-spec/-digital.git gabinete-asf-real` (em `C:\Projetos`). Confirmar que aponta pro banco 2026.
- [ ] **Step 2: Aplicar a Task 2 (LoginScreen + App.jsx) nesse repo** (mesmo código).
- [ ] **Step 3: Aplicar a migração da Task 1 no banco 2026** (`nhlidwbdjaapynbvyviy`).
- [ ] **Step 4: Criar as contas reais** (candidato Paulinho + ADMs/equipe) no Auth do 2026 + `membros` com papel.
- [ ] **Step 5: Publicar** — push → Vercel republica os apps. Configurar as variáveis de ambiente na Vercel se necessário.
- [ ] **Step 6: Verificação final** — login real funciona; anon não acessa; dados reais aparecem só logado.

---

## Notas de execução
- Task 1 (migração) e os testes externos anônimos são executados pelo **controlador** via Supabase MCP / curl.
- As **rotas públicas** (`VisualizarMidia`, `CadastroPublico`) ficarão quebradas para anônimo após esta mudança (dependem das tabelas trancadas). Tratar em etapa separada com políticas anônimas restritas por token — está no "fora de escopo" do spec.
- Não commitar `.env`.
