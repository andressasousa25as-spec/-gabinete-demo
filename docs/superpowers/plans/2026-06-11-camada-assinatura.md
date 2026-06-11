# Camada de Assinatura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar trava de assinatura (teste 7 dias / licença 45+ dias), tela master de controle, onboarding self-service por convite e correção das rotas públicas no app demo do Gabinete Digital, validado local e publicado na Vercel.

**Architecture:** Licença mora no banco de cada cliente (tabela `licenca`, linha única). O login lê a licença; se vencida e o usuário não é master, bloqueia. Master (Andressa) entra sempre e gerencia status/validade por uma tela dentro do app. RLS no banco reforça a trava. Sem servidor central.

**Tech Stack:** React 19 + Vite + Supabase (JS/`.jsx`), `@supabase/supabase-js`. Testes da lógica pura com Vitest. SQL aplicado via Supabase MCP no projeto demo `yemlhsidmlxzpqimewox`.

**Contexto de papéis (`public.membros`):** colunas `user_id (uuid)`, `gabinete_id (uuid)`, `papel (text)`, `nome (text)`, `created_at`. Papéis atuais: `candidato`, `equipe`. Adiciona-se `master`. Conta master de teste: `gabinetedigitaldigitalsf@gmail.com`.

---

### Task 1: Tabela `licenca` + RLS no banco demo

**Onde:** Supabase projeto `yemlhsidmlxzpqimewox` (aplicar via MCP `apply_migration`, name `licenca_e_gate`).

- [ ] **Step 1: Criar tabela, funções e seed (migration)**

```sql
-- Tabela de licença: uma linha por banco/cliente
create table if not exists public.licenca (
  id integer primary key default 1,
  status text not null default 'teste' check (status in ('teste','ativo','vencido')),
  validade date not null default (current_date + 7),
  plano text,
  atualizado_em timestamptz not null default now(),
  constraint licenca_singleton check (id = 1)
);

-- Seed da linha única (teste = 7 dias a partir de hoje)
insert into public.licenca (id, status, validade)
values (1, 'teste', current_date + 7)
on conflict (id) do nothing;

-- Helpers usados nas políticas
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

-- Marca master no membro de teste (idempotente)
update public.membros m set papel = 'master'
from auth.users u
where m.user_id = u.id and u.email = 'gabinetedigitaldigitalsf@gmail.com';

-- RLS da própria tabela licenca: qualquer autenticado lê; só master escreve
alter table public.licenca enable row level security;
drop policy if exists licenca_select on public.licenca;
create policy licenca_select on public.licenca for select to authenticated using (true);
drop policy if exists licenca_update on public.licenca;
create policy licenca_update on public.licenca for update to authenticated
  using (public.eh_master()) with check (public.eh_master());
```

- [ ] **Step 2: Reforçar RLS das tabelas de dados (gate no banco)**

Para cada tabela sensível, a política de `authenticated` exige licença válida OU master. Aplicar para `eleitores`, `liderancas`, `reunioes`, `anotacoes`, `midias`:

```sql
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
```

- [ ] **Step 3: Verificar (SQL)**

Run (via MCP `execute_sql`):
```sql
select status, validade, validade - current_date as dias_restantes from public.licenca;
select papel from public.membros m join auth.users u on u.id=m.user_id where u.email='gabinetedigitaldigitalsf@gmail.com';
```
Expected: uma linha `teste`, `dias_restantes` = 7; papel = `master`.

- [ ] **Step 4: Commit (registrar a migration no repo)**

Salvar o SQL acima em `supabase/migrations/20260611120000_licenca_e_gate.sql` e:
```bash
git add supabase/migrations/20260611120000_licenca_e_gate.sql
git commit -m "feat(db): tabela licenca + gate RLS no demo"
```

---

### Task 2: Lógica pura `licencaVencida` (TDD com Vitest)

**Files:**
- Create: `src/lib/licenca.js`
- Test: `src/lib/licenca.test.js`
- Modify: `package.json` (script de teste + devDep vitest)

- [ ] **Step 1: Instalar Vitest**

Run:
```bash
npm install -D vitest
```
E adicionar em `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Escrever o teste que falha**

```js
// src/lib/licenca.test.js
import { describe, it, expect } from 'vitest';
import { licencaVencida } from './licenca';

describe('licencaVencida', () => {
  const hoje = new Date('2026-06-11');
  it('valida quando status ativo e validade no futuro', () => {
    expect(licencaVencida({ status: 'ativo', validade: '2026-08-01' }, hoje)).toBe(false);
  });
  it('vencida quando validade no passado', () => {
    expect(licencaVencida({ status: 'ativo', validade: '2026-06-10' }, hoje)).toBe(true);
  });
  it('vencida quando status vencido mesmo com validade futura', () => {
    expect(licencaVencida({ status: 'vencido', validade: '2026-08-01' }, hoje)).toBe(true);
  });
  it('valida no ultimo dia (validade == hoje)', () => {
    expect(licencaVencida({ status: 'teste', validade: '2026-06-11' }, hoje)).toBe(false);
  });
  it('trata licenca ausente como vencida', () => {
    expect(licencaVencida(null, hoje)).toBe(true);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL ("Failed to resolve import './licenca'" ou função indefinida).

- [ ] **Step 4: Implementar mínimo**

```js
// src/lib/licenca.js
// Decide se a licença está vencida. `hoje` é injetável para teste.
export function licencaVencida(licenca, hoje = new Date()) {
  if (!licenca) return true;
  if (licenca.status === 'vencido') return true;
  const fim = new Date(licenca.validade + 'T23:59:59');
  return fim < hoje;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test`
Expected: PASS (5 testes).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/licenca.js src/lib/licenca.test.js
git commit -m "feat: logica pura licencaVencida + vitest"
```

---

### Task 3: Trava no login + Tela de bloqueio

**Files:**
- Create: `src/components/TelaBloqueio.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Criar TelaBloqueio**

```jsx
// src/components/TelaBloqueio.jsx
export default function TelaBloqueio({ onLogout }) {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:420, textAlign:'center', boxShadow:'0 25px 50px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Assinatura vencida</h1>
        <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Seu acesso ao Gabinete Digital está suspenso. Entre em contato para reativar. Seus dados estão guardados e seguros.</p>
        <button onClick={onLogout} style={{ width:'100%', padding:13, borderRadius:10, background:'#1e40af', color:'white', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ligar a trava no App.jsx**

Adicionar import e estado de licença; carregar junto com o papel; bloquear quando vencida e não-master.

Em `src/App.jsx`, adicionar imports no topo:
```jsx
import TelaBloqueio from './components/TelaBloqueio';
import { licencaVencida } from './lib/licenca';
```

Adicionar estado (junto aos outros `useState`):
```jsx
  const [licenca, setLicenca] = useState(null);
  const [licencaCarregada, setLicencaCarregada] = useState(false);
```

Substituir o `useEffect` que carrega `membros` (linhas ~32-36) por uma versão que também lê a licença:
```jsx
  useEffect(() => {
    if (!sessao?.user) { setPapel(null); setMembro(null); setLicenca(null); setLicencaCarregada(false); return; }
    supabase.from('membros').select('*').eq('user_id', sessao.user.id).maybeSingle()
      .then(({ data }) => { setMembro(data); setPapel(data?.papel || 'equipe'); });
    supabase.from('licenca').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { setLicenca(data); setLicencaCarregada(true); });
  }, [sessao]);
```

Substituir o bloco de render final (a partir de `if (!papel) ...`) por:
```jsx
  if (!papel || !licencaCarregada) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Carregando...</div>;

  const ehMaster = papel === 'master';
  if (licencaVencida(licenca) && !ehMaster) return <TelaBloqueio onLogout={handleLogout} />;

  return (
    <Dashboard
      candidato={candidato}
      perfil={papel}
      admLogado={papel === 'adm' ? membro : null}
      onLogout={handleLogout}
    />
  );
```

- [ ] **Step 3: Verificar manualmente (local)**

Run: `npm run dev` e abrir `http://localhost:5174`.
- Login master em dia → Dashboard.
- Via SQL: `update public.licenca set status='vencido' where id=1;` → recarregar com usuário **comum** (papel candidato/equipe) → vê TelaBloqueio.
- Mesmo vencido, login **master** → entra no Dashboard.
- Reverter: `update public.licenca set status='teste', validade=current_date+7 where id=1;`

- [ ] **Step 4: Commit**

```bash
git add src/components/TelaBloqueio.jsx src/App.jsx
git commit -m "feat: trava de assinatura no login + tela de bloqueio"
```

---

### Task 4: Tela Master + integração no Dashboard

**Files:**
- Create: `src/components/TelaMaster.jsx`
- Modify: `src/components/Dashboard.jsx`

- [ ] **Step 1: Criar TelaMaster**

```jsx
// src/components/TelaMaster.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TelaMaster({ onVoltar }) {
  const [lic, setLic] = useState(null);
  const [msg, setMsg] = useState('');

  const carregar = () => supabase.from('licenca').select('*').eq('id',1).maybeSingle().then(({data})=>setLic(data));
  useEffect(()=>{ carregar(); }, []);

  const salvar = async (campos) => {
    setMsg('Salvando...');
    const { error } = await supabase.from('licenca').update({ ...campos, atualizado_em: new Date().toISOString() }).eq('id',1);
    setMsg(error ? 'Erro: '+error.message : 'Salvo.');
    carregar();
  };

  const addDias = (n) => {
    const base = lic?.validade && new Date(lic.validade) > new Date() ? new Date(lic.validade) : new Date();
    base.setDate(base.getDate()+n);
    salvar({ status:'ativo', validade: base.toISOString().slice(0,10) });
  };

  if (!lic) return <div style={{padding:24,color:'#f1f5f9',background:'#0a0f1c',minHeight:'100vh'}}>Carregando...</div>;

  return (
    <div style={{background:'#0a0f1c',minHeight:'100vh',padding:'24px',color:'#f1f5f9'}}>
      <button onClick={onVoltar} style={{marginBottom:20,padding:'10px 20px',background:'#1e40af',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>Voltar</button>
      <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:16,padding:24,maxWidth:480}}>
        <h2 style={{marginTop:0}}>👑 Painel Master — Assinatura</h2>
        <p>Status: <b style={{color:lic.status==='ativo'?'#22c55e':lic.status==='vencido'?'#ef4444':'#f59e0b'}}>{lic.status}</b></p>
        <p>Validade: <b>{lic.validade}</b></p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}>
          <button onClick={()=>addDias(45)} style={btn('#16a34a')}>Ativar / +45 dias</button>
          <button onClick={()=>addDias(30)} style={btn('#0ea5e9')}>+30 dias</button>
          <button onClick={()=>salvar({status:'vencido'})} style={btn('#dc2626')}>Bloquear agora</button>
        </div>
        {msg && <p style={{marginTop:14,color:'#93c5fd'}}>{msg}</p>}
      </div>
    </div>
  );
}
const btn = (bg) => ({background:bg,color:'white',border:'none',borderRadius:8,padding:'10px 16px',cursor:'pointer',fontWeight:700,fontSize:14});
```

- [ ] **Step 2: Integrar no Dashboard.jsx**

Import no topo (junto aos outros componentes):
```jsx
import TelaMaster from './TelaMaster';
```

Adicionar roteamento de aba (junto às outras linhas `if(aba===...)`, ex. após a linha 205):
```jsx
  if(aba==='master') return <TelaMaster onVoltar={()=>setAba('inicio')} />;
```

Tratar o papel master como acesso completo + botão no menu. Substituir a linha 220-222 (`const botoesMenu = perfil==='candidato' ? [...] : [...]`) por:
```jsx
  const acessoTotal = perfil==='candidato' || perfil==='master';
  const botoesMenu = acessoTotal
    ? [...(perfil==='master'?[{l:'👑 Master',a:()=>setAba('master')}]:[]),{l:'Config',a:()=>alert('Configure seu nome em Configuracoes no Supabase')},{l:'ADMs',a:()=>setAba('admins')},{l:'+ Eleitor',a:()=>setShowCadastro(true)},{l:'+ Lideranca',a:()=>setShowLider(true)},{l:'+ Reuniao',a:()=>setShowReuniao(true)},{l:'Mapa',a:()=>setAba('mapa')},{l:'Anotacoes',a:()=>setAba('anotacoes')},{l:'Midias',a:()=>setAba('midias')},{l:'Analytics',a:()=>setAba('analytics')},{l:'Ranking',a:()=>setAba('ranking')},{l:'Votacao',a:()=>setAba('locais')},{l:'Redes Sociais',a:()=>setAba('redes')},{l:'Links',a:()=>setAba('rastreamento')},{l:'Cenario',a:()=>setAba('cenario')},{l:'Cenario Municipal',a:()=>setAba('cenario-municipal')},{l:'Diagnostico',a:()=>setAba('diagnostico')},{l:'Mapa TSE',a:()=>setAba('mapaeleitoral')},{l:'Territorial',a:()=>setAba('territorial')},{l:'Oportunidades',a:()=>setAba('radar')},{l:'Vitoria',a:()=>setAba('caminho')},{l:'Projecao',a:()=>setAba('projecao')},{l:'Relatorios',a:()=>setAba('relatorios')}]
    : [{l:'+ Eleitor',a:()=>setShowCadastro(true)},{l:'+ Reuniao',a:()=>setShowReuniao(true)},{l:'Mapa',a:()=>setAba('mapa')},{l:'Midias',a:()=>setAba('midias')},{l:'Redes Sociais',a:()=>setAba('redes')},{l:'Relatorios',a:()=>setAba('relatorios')}];
```

Nota: as demais checagens `perfil==='candidato'` (botões editar/excluir) podem permanecer; master usa o painel para assinatura, não precisa editar eleitores. YAGNI: não alterar essas linhas.

- [ ] **Step 3: Verificar manualmente (local)**

Run: `npm run dev`. Login master → botão "👑 Master" aparece → abre painel → "Ativar / +45 dias" muda status para `ativo` e soma 45 dias (confere via SQL ou recarregando). "Bloquear agora" → status `vencido`. Login comum → botão Master **não** aparece.

- [ ] **Step 4: Commit**

```bash
git add src/components/TelaMaster.jsx src/components/Dashboard.jsx
git commit -m "feat: tela master de controle de assinatura"
```

---

### Task 5: Onboarding self-service por convite

**Files:**
- Modify: `src/components/LoginScreen.jsx`
- Create: `docs/PROVISIONAR-CLIENTE.md`

- [ ] **Step 1: Adicionar "Esqueci/criar senha" no LoginScreen**

O convite do Supabase manda o cliente para uma URL de recuperação; precisamos também de um link para reenviar. Adicionar abaixo do botão Entrar (antes do `<p>` final), em `src/components/LoginScreen.jsx`:
```jsx
        <button onClick={async()=>{ if(!email) return setErro('Digite seu e-mail acima.'); const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin}); setErro(error?'Erro ao enviar.':'Enviamos um link para definir sua senha.'); }}
          style={{ width:'100%', padding:10, marginTop:10, borderRadius:10, background:'transparent', color:'#1e40af', border:'1px solid #1e40af', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Criar / redefinir senha
        </button>
```

- [ ] **Step 2: Tratar o retorno do link (definir nova senha)**

O Supabase coloca `type=recovery` no hash ao voltar do e-mail. Tratamos com um estado próprio e uma tela mínima.

Em `src/App.jsx`, adicionar o estado junto aos outros `useState` (o `useState` já está importado no arquivo):
```jsx
  const [recovery, setRecovery] = useState(window.location.hash.includes('type=recovery'));
```

No render, antes de `if (!sessao) return <LoginScreen .../>`, adicionar:
```jsx
  if (recovery) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
        <div style={{background:'white',padding:32,borderRadius:16,maxWidth:360,width:'100%'}}>
          <h2 style={{marginTop:0,fontSize:18}}>Defina sua senha</h2>
          <input id="nova" type="password" placeholder="Nova senha" style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #e2e8f0',boxSizing:'border-box',marginBottom:12}} />
          <button onClick={async()=>{ const v=document.getElementById('nova').value; const {error}=await supabase.auth.updateUser({password:v}); if(!error){ setRecovery(false); window.location.hash=''; } else alert(error.message); }}
            style={{width:'100%',padding:12,borderRadius:8,background:'#1e40af',color:'white',border:'none',fontWeight:700,cursor:'pointer'}}>Salvar senha</button>
        </div>
      </div>
    );
  }
```

- [ ] **Step 3: Documentar o provisionamento**

```markdown
# Provisionar um novo cliente (Gabinete Digital)

1. Criar projeto Supabase novo (ou usar o do cliente).
2. Rodar as migrations (`supabase/migrations/`), incluindo `licenca_e_gate`.
3. Em Authentication > Users, convidar o e-mail do cliente (Invite user).
4. Inserir o membro: `insert into membros (user_id, papel, nome) values ('<uuid-do-convidado>','candidato','<nome>');`
5. Inserir seu master: convidar seu e-mail e `update membros set papel='master' ...`.
6. Licença já entra como `teste` + 7 dias. Ao receber pagamento, ativar pela Tela Master (+45 dias).
7. Apontar `.env` do deploy (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) para o projeto e publicar.
```

- [ ] **Step 4: Verificar manualmente**

Run: `npm run dev`. Clicar "Criar / redefinir senha" com um e-mail válido → mensagem de envio. (Teste completo do e-mail exige SMTP configurado no Supabase — anotar como dependência de produção.)

- [ ] **Step 5: Commit**

```bash
git add src/components/LoginScreen.jsx src/App.jsx docs/PROVISIONAR-CLIENTE.md
git commit -m "feat: onboarding self-service por convite/recuperacao de senha"
```

---

### Task 6: Rotas públicas por token (RLS anon restrita)

**Files:**
- Modify (DB): políticas `anon` em `midias`, `midias_cliques`, `liderancas`, `eleitores`
- Verify: `src/components/VisualizarMidia.jsx`, `src/components/CadastroPublico.jsx`

- [ ] **Step 1: Conferir o que cada rota pública lê/grava**

Run (leitura): abrir `src/components/VisualizarMidia.jsx` e `src/components/CadastroPublico.jsx` e anotar quais tabelas/colunas acessam via `supabase` com a chave anon (ex.: `VisualizarMidia` lê `midias` por `midiaId` e grava clique; `CadastroPublico` lê `liderancas` por id e grava `eleitores`).

- [ ] **Step 2: Criar políticas anon restritas (migration `rotas_publicas`)**

Aplicar via MCP `apply_migration` (ajustar nomes de coluna conforme o Step 1):
```sql
-- Mídia: anon lê uma mídia específica (por id na URL) e registra clique
drop policy if exists midia_publica_select on public.midias;
create policy midia_publica_select on public.midias for select to anon using (true);
drop policy if exists midia_clique_insert on public.midias_cliques;
create policy midia_clique_insert on public.midias_cliques for insert to anon with check (true);

-- Cadastro público: anon lê a liderança do link e insere eleitor vinculado
drop policy if exists lideranca_publica_select on public.liderancas;
create policy lideranca_publica_select on public.liderancas for select to anon using (true);
drop policy if exists cadastro_publico_insert on public.eleitores;
create policy cadastro_publico_insert on public.eleitores for insert to anon with check (true);
```
Nota: estas políticas liberam apenas SELECT por id (a app filtra por id/token na URL) e INSERT — nunca UPDATE/DELETE para `anon`. Não há política `anon` de SELECT em `eleitores`, então a base continua fechada para leitura anônima.

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev`. Abrir `http://localhost:5174/#/m/<midiaId>/<eleitorId>` → mídia carrega e clique é gravado. Abrir `http://localhost:5174/#/cadastro/<liderancaId>` → form carrega e cadastra eleitor. Confirmar que `select * from eleitores` com a chave anon (sem login) **não** retorna linhas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260611130000_rotas_publicas.sql
git commit -m "feat(db): rotas publicas anon restritas por token"
```

---

### Task 7: Build e deploy na Vercel

- [ ] **Step 1: Build local**

Run: `npm run build`
Expected: build sem erros (dist gerado).

- [ ] **Step 2: Rodar testes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Merge para a branch publicada**

```bash
git checkout main
git merge feat/login-real
git push origin main
```
Expected: Vercel detecta o push e redeploya `gabinete-demo.vercel.app`.

- [ ] **Step 4: Verificar produção**

Abrir `https://gabinete-demo.vercel.app/` → exige login → login master entra → Tela Master funciona → logout.

---

## Notas de execução

- **Conta master de teste:** `gabinetedigitaldigitalsf@gmail.com` (papel `master` no `membros` do demo).
- **SMTP:** o convite/recuperação por e-mail exige SMTP configurado no Supabase Auth; em produção, configurar antes de vender. Em teste, validar o fluxo de UI sem envio real.
- **Próximo (fora deste plano):** replicar tudo no gabinete do Paulinho (repo `-digital`, banco 2026 `nhlidwbdjaapynbvyviy`), criando as contas reais **antes** de publicar.
