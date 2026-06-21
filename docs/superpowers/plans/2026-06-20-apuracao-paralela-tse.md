# Apuração Paralela ao TSE (Fase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apuração paralela na noite da eleição: fiscais lançam os votos do nosso candidato + adversários por seção (com foto do boletim, funcionando offline) e o gabinete vê o resultado agregado ao vivo, por local apurado.

**Architecture:** Migration cria `apuracao_candidatos` (config) e `apuracao_secao` (lançamentos) + bucket `boletins`. Lógica pura de agregação/duplicidade em `src/lib/apuracao.js` (testada). UI: config (CRUD candidatos), lançamento offline-aware (foto via Storage; offline guarda o blob em IndexedDB e sincroniza), painel ao vivo (Supabase Realtime). Espelhado nos 2 repos/2 bancos.

**Tech Stack:** React + Vite (JS), Supabase (Postgres, Storage, Realtime), IndexedDB (idb), vitest.

**Repos/bancos:** Primeiro em `gabinete-demo-real` (repo `-gabinete-demo`, banco `yemlhsidmlxzpqimewox`); depois espelhar no Paulinho (repo `gabinete-digital` branch `main`, banco `nhlidwbdjaapynbvyviy`). Trabalhar em branch `feat/apuracao`; merge na master só com aprovação. Migrations via Supabase MCP nos 2 bancos.

---

## File Structure

**Criados:**
- `src/lib/apuracao.js` — lógica pura: agregação de totais, ranking, % apurado, resolução de duplicidade. + fila offline de apuração (blob da foto em IndexedDB).
- `src/lib/apuracao.test.js` — testes da lógica pura.
- `src/components/ApuracaoConfig.jsx` — CRUD dos candidatos acompanhados.
- `src/components/ApuracaoLancamento.jsx` — tela do fiscal (offline-aware + foto).
- `src/components/ApuracaoPainel.jsx` — painel de resultados ao vivo.
- `supabase/migrations/20260620120000_apuracao.sql` — tabelas + RLS (bucket via MCP/painel).

**Modificados:**
- `src/components/DashboardCandidato.jsx` — imports + abas (`apuracao-config`, `apuracao-lancar`, `apuracao-painel`) + botões no menu.

---

## FASE A — Banco de dados

### Task 1: Migration apuracao (nos 2 bancos)

**Files:**
- Create: `supabase/migrations/20260620120000_apuracao.sql`

- [ ] **Step 1: Escrever a migration**

Create `supabase/migrations/20260620120000_apuracao.sql`:
```sql
create table if not exists public.apuracao_candidatos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  nome text not null,
  numero text,
  partido text,
  eh_nosso boolean default false,
  ordem int default 0
);

create table if not exists public.apuracao_secao (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  municipio text not null,
  zona text not null,
  secao text not null,
  votos jsonb not null default '{}'::jsonb,
  total_secao int,
  foto_url text,
  reportado_por uuid references auth.users(id) on delete set null,
  reportado_nome text,
  status text default 'ok' check (status in ('ok','conferir')),
  unique (municipio, zona, secao)
);
create index if not exists idx_apuracao_secao_local on public.apuracao_secao(municipio, zona, secao);

create or replace function public.update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_apuracao_updated_at on public.apuracao_secao;
create trigger trg_apuracao_updated_at before update on public.apuracao_secao
  for each row execute function public.update_updated_at();

alter table public.apuracao_candidatos enable row level security;
alter table public.apuracao_secao enable row level security;
drop policy if exists acesso_logado on public.apuracao_candidatos;
create policy acesso_logado on public.apuracao_candidatos for all to authenticated
  using (public.licenca_valida() or public.eh_master())
  with check (public.licenca_valida() or public.eh_master());
drop policy if exists acesso_logado on public.apuracao_secao;
create policy acesso_logado on public.apuracao_secao for all to authenticated
  using (public.licenca_valida() or public.eh_master())
  with check (public.licenca_valida() or public.eh_master());
```

- [ ] **Step 2: Aplicar nos 2 bancos via MCP**

Aplicar `apply_migration` (name `apuracao`) nos projetos `yemlhsidmlxzpqimewox` e `nhlidwbdjaapynbvyviy`. Verificar com `list_tables` que as duas tabelas existem com RLS nos dois.

- [ ] **Step 3: Criar bucket de boletins (nos 2 bancos)**

Via `execute_sql` em cada banco:
```sql
insert into storage.buckets (id, name, public) values ('boletins','boletins', true)
on conflict (id) do nothing;
```
(Bucket público para leitura; escrita exige usuário autenticado pelas policies padrão do Storage. Se as policies de Storage do projeto não permitirem insert por authenticated, criar policy: permitir `insert`/`select` no bucket `boletins` para `authenticated`.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260620120000_apuracao.sql
git commit -m "feat: tabelas de apuração (candidatos, seções) + RLS"
```

---

## FASE B — Lógica pura (TDD)

### Task 2: src/lib/apuracao.js — agregação, ranking, % apurado, duplicidade

**Files:**
- Create: `src/lib/apuracao.js`
- Test: `src/lib/apuracao.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/apuracao.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { agregarVotos, percentualApurado, resolverDuplicidade } from './apuracao.js';

const candidatos = [
  { id: 'a', nome: 'Nosso', eh_nosso: true },
  { id: 'b', nome: 'Rival 1' },
  { id: 'c', nome: 'Rival 2' },
];
const lancamentos = [
  { municipio: 'Macapá', zona: '1', secao: '10', votos: { a: 100, b: 50, c: 20 } },
  { municipio: 'Macapá', zona: '1', secao: '11', votos: { a: 80, b: 60, c: 10 } },
];

describe('agregarVotos', () => {
  it('soma os votos por candidato e ordena (nosso destacado)', () => {
    const r = agregarVotos(lancamentos, candidatos);
    expect(r.totais.a).toBe(180);
    expect(r.totais.b).toBe(110);
    expect(r.totais.c).toBe(30);
    expect(r.ranking[0].id).toBe('a');
    expect(r.ranking[0].votos).toBe(180);
    expect(r.nosso.votos).toBe(180);
  });
  it('lida com candidato sem votos lançados', () => {
    const r = agregarVotos([], candidatos);
    expect(r.totais.a).toBe(0);
    expect(r.ranking.length).toBe(3);
  });
});

describe('percentualApurado', () => {
  it('calcula seções reportadas sobre o total esperado', () => {
    expect(percentualApurado(2, 8)).toBe(25);
    expect(percentualApurado(0, 0)).toBe(0);
  });
});

describe('resolverDuplicidade', () => {
  it('sem registro existente: ação insert', () => {
    const r = resolverDuplicidade(null, { a: 10 });
    expect(r.acao).toBe('insert');
    expect(r.status).toBe('ok');
  });
  it('existente com mesmos números: substitui, status ok', () => {
    const r = resolverDuplicidade({ votos: { a: 10 } }, { a: 10 });
    expect(r.acao).toBe('update');
    expect(r.status).toBe('ok');
  });
  it('existente com números diferentes: substitui, status conferir', () => {
    const r = resolverDuplicidade({ votos: { a: 10 } }, { a: 99 });
    expect(r.acao).toBe('update');
    expect(r.status).toBe('conferir');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/apuracao.test.js`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Create `src/lib/apuracao.js`:
```js
// Lógica pura da apuração (sem dependência de banco/UI).

export function agregarVotos(lancamentos, candidatos) {
  const totais = {};
  for (const c of candidatos) totais[c.id] = 0;
  for (const l of lancamentos) {
    const v = l.votos || {};
    for (const id of Object.keys(v)) {
      totais[id] = (totais[id] || 0) + (Number(v[id]) || 0);
    }
  }
  const ranking = candidatos
    .map((c) => ({ id: c.id, nome: c.nome, eh_nosso: !!c.eh_nosso, votos: totais[c.id] || 0 }))
    .sort((x, y) => y.votos - x.votos);
  const nosso = ranking.find((r) => r.eh_nosso) || null;
  return { totais, ranking, nosso };
}

export function percentualApurado(reportadas, totalEsperado) {
  if (!totalEsperado || totalEsperado <= 0) return 0;
  return Math.round((reportadas / totalEsperado) * 100);
}

export function resolverDuplicidade(existente, novosVotos) {
  if (!existente) return { acao: 'insert', status: 'ok' };
  const a = JSON.stringify(existente.votos || {});
  const b = JSON.stringify(novosVotos || {});
  return { acao: 'update', status: a === b ? 'ok' : 'conferir' };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/apuracao.test.js`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/apuracao.js src/lib/apuracao.test.js
git commit -m "feat: lógica pura da apuração (agregação, % apurado, duplicidade) com testes"
```

### Task 3: Fila offline de apuração (foto em IndexedDB)

**Files:**
- Modify: `src/lib/apuracao.js`

A foto não pode subir offline; o lançamento guarda o blob localmente e sobe na sincronização.

- [ ] **Step 1: Adicionar a fila e o submit resiliente**

Append to `src/lib/apuracao.js`:
```js
import { openDB } from 'idb';
import { supabase } from './supabase';

async function filaDB() {
  return openDB('gabinete-apuracao', 1, {
    upgrade(d) { d.createObjectStore('fila', { keyPath: 'id', autoIncrement: true }); },
  });
}

async function uploadFoto(blob, municipio, zona, secao) {
  const path = `boletim-${municipio}-${zona}-${secao}-${Date.now()}.jpg`.replace(/\s+/g, '_');
  const { error } = await supabase.storage.from('boletins').upload(path, blob, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('boletins').getPublicUrl(path).data.publicUrl;
}

// Grava no banco; resolve duplicidade. dados: { municipio, zona, secao, votos, total_secao, reportado_por, reportado_nome }
async function gravarSecao(dados, fotoUrl) {
  const { data: existente } = await supabase
    .from('apuracao_secao').select('id, votos')
    .eq('municipio', dados.municipio).eq('zona', dados.zona).eq('secao', dados.secao).maybeSingle();
  const { resolverDuplicidade } = await import('./apuracao.js');
  const r = resolverDuplicidade(existente, dados.votos);
  const linha = { ...dados, foto_url: fotoUrl, status: r.status };
  if (r.acao === 'insert') {
    const { error } = await supabase.from('apuracao_secao').insert(linha);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('apuracao_secao').update({ ...linha, updated_at: new Date().toISOString() }).eq('id', existente.id);
    if (error) throw error;
  }
}

// Online: sobe foto + grava. Offline/erro: enfileira (blob incluso). Retorna { modo }.
export async function enviarApuracao(dados, fotoBlob) {
  if (navigator.onLine) {
    try {
      const url = fotoBlob ? await uploadFoto(fotoBlob, dados.municipio, dados.zona, dados.secao) : null;
      await gravarSecao(dados, url);
      return { modo: 'online' };
    } catch (_) { /* cai pra fila */ }
  }
  const db = await filaDB();
  await db.add('fila', { dados, fotoBlob, criadoEm: Date.now() });
  return { modo: 'fila' };
}

export async function pendentesApuracao() {
  const db = await filaDB();
  return (await db.getAll('fila')).length;
}

export async function sincronizarApuracao() {
  const db = await filaDB();
  const itens = await db.getAll('fila');
  let enviados = 0;
  for (const item of itens) {
    try {
      const url = item.fotoBlob ? await uploadFoto(item.fotoBlob, item.dados.municipio, item.dados.zona, item.dados.secao) : null;
      await gravarSecao(item.dados, url);
      await db.delete('fila', item.id);
      enviados++;
    } catch (_) { /* mantém na fila */ }
  }
  return { enviados };
}
```

- [ ] **Step 2: Build para validar imports**

Run: `npx vite build`
Expected: conclui sem erro.

- [ ] **Step 3: Commit**

```bash
git add src/lib/apuracao.js
git commit -m "feat: envio resiliente da apuração (foto no Storage + fila offline)"
```

---

## FASE C — Configuração de candidatos

### Task 4: ApuracaoConfig.jsx

**Files:**
- Create: `src/components/ApuracaoConfig.jsx`

- [ ] **Step 1: Criar o componente**

Create `src/components/ApuracaoConfig.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ApuracaoConfig({ onVoltar }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ nome: '', numero: '', partido: '', eh_nosso: false });
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('apuracao_candidatos').select('*').order('ordem');
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function adicionar(e) {
    e.preventDefault();
    setCarregando(true);
    await supabase.from('apuracao_candidatos').insert({ ...form, ordem: lista.length });
    setForm({ nome: '', numero: '', partido: '', eh_nosso: false });
    setCarregando(false);
    carregar();
  }
  async function remover(id) {
    if (!window.confirm('Remover este candidato?')) return;
    await supabase.from('apuracao_candidatos').delete().eq('id', id);
    carregar();
  }

  const inp = { padding: 10, marginRight: 8, marginBottom: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8 };
  return (
    <div style={{ padding: 30, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Candidatos acompanhados</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>}
      </div>
      <form onSubmit={adicionar} style={{ marginBottom: 20 }}>
        <input placeholder="Nome de urna *" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required style={inp} />
        <input placeholder="Número" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} style={inp} />
        <input placeholder="Partido" value={form.partido} onChange={e => setForm({ ...form, partido: e.target.value })} style={inp} />
        <label style={{ color: '#f1f5f9', marginRight: 8 }}>
          <input type="checkbox" checked={form.eh_nosso} onChange={e => setForm({ ...form, eh_nosso: e.target.checked })} /> Nosso candidato
        </label>
        <button type="submit" disabled={carregando} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>+ Adicionar</button>
      </form>
      {lista.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.eh_nosso ? '#1e293b' : '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <span style={{ color: '#f1f5f9' }}>{c.eh_nosso ? '⭐ ' : ''}{c.nome} {c.numero ? `(${c.numero})` : ''} {c.partido || ''}</span>
          <button onClick={() => remover(c.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>🗑️</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: conclui.

- [ ] **Step 3: Commit**

```bash
git add src/components/ApuracaoConfig.jsx
git commit -m "feat: tela de configuração dos candidatos acompanhados"
```

---

## FASE D — Lançamento do fiscal

### Task 5: ApuracaoLancamento.jsx

**Files:**
- Create: `src/components/ApuracaoLancamento.jsx`

- [ ] **Step 1: Criar o componente**

Create `src/components/ApuracaoLancamento.jsx`:
```jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { enviarApuracao } from '../lib/apuracao';

export default function ApuracaoLancamento({ perfil, onVoltar }) {
  const [candidatos, setCandidatos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [municipio, setMunicipio] = useState('');
  const [zona, setZona] = useState('');
  const [secao, setSecao] = useState('');
  const [votos, setVotos] = useState({});
  const [totalSecao, setTotalSecao] = useState('');
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('apuracao_candidatos').select('*').order('ordem').then(({ data }) => setCandidatos(data || []));
    supabase.from('locais_votacao').select('municipio, zona, secoes').then(({ data }) => setLocais(data || []));
  }, []);

  const municipios = useMemo(() => [...new Set(locais.map(l => l.municipio).filter(Boolean))].sort(), [locais]);
  const zonas = useMemo(() => [...new Set(locais.filter(l => l.municipio === municipio).map(l => l.zona).filter(Boolean))].sort(), [locais, municipio]);

  async function enviar(e) {
    e.preventDefault();
    if (!municipio || !zona || !secao) { setMsg('Preencha município, zona e seção.'); return; }
    if (!foto) { setMsg('Anexe a foto do boletim.'); return; }
    setEnviando(true); setMsg('');
    const dados = {
      municipio, zona, secao,
      votos: Object.fromEntries(candidatos.map(c => [c.id, Number(votos[c.id]) || 0])),
      total_secao: totalSecao ? Number(totalSecao) : null,
      reportado_por: perfil?.user_id || null,
      reportado_nome: perfil?.nome || null,
    };
    const r = await enviarApuracao(dados, foto);
    setMsg(r.modo === 'fila' ? '📴 Sem conexão — salvo e será enviado ao reconectar.' : '✅ Seção registrada!');
    setVotos({}); setTotalSecao(''); setSecao(''); setFoto(null);
    e.target.reset?.();
    setEnviando(false);
  }

  const inp = { width: '100%', padding: 10, marginBottom: 10, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' };
  return (
    <form onSubmit={enviar} style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Apuração — lançar seção</h2>
        {onVoltar && <button type="button" onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
      </div>
      <select value={municipio} onChange={e => { setMunicipio(e.target.value); setZona(''); }} style={inp}>
        <option value="">Município...</option>
        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={zona} onChange={e => setZona(e.target.value)} style={inp} disabled={!municipio}>
        <option value="">Zona...</option>
        {zonas.map(z => <option key={z} value={z}>Zona {z}</option>)}
      </select>
      <input placeholder="Seção (número)" value={secao} onChange={e => setSecao(e.target.value)} style={inp} inputMode="numeric" />
      <div style={{ borderTop: '1px solid #334155', margin: '12px 0', paddingTop: 12 }}>
        {candidatos.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1, color: '#f1f5f9' }}>{c.eh_nosso ? '⭐ ' : ''}{c.nome}</span>
            <input type="number" min="0" value={votos[c.id] || ''} onChange={e => setVotos({ ...votos, [c.id]: e.target.value })} placeholder="votos" style={{ ...inp, width: 110, marginBottom: 0 }} />
          </div>
        ))}
      </div>
      <input type="number" min="0" placeholder="Total de votos da seção (opcional)" value={totalSecao} onChange={e => setTotalSecao(e.target.value)} style={inp} />
      <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>Foto do boletim *</label>
      <input type="file" accept="image/*" capture="environment" onChange={e => setFoto(e.target.files?.[0] || null)} style={inp} />
      {msg && <p style={{ color: '#CBA15C' }}>{msg}</p>}
      <button type="submit" disabled={enviando} style={{ width: '100%', background: '#CBA15C', color: '#0E2236', border: 'none', padding: 14, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        {enviando ? 'Enviando...' : 'Registrar seção'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: conclui.

- [ ] **Step 3: Commit**

```bash
git add src/components/ApuracaoLancamento.jsx
git commit -m "feat: tela do fiscal para lançar a apuração (offline + foto)"
```

---

## FASE E — Painel ao vivo

### Task 6: ApuracaoPainel.jsx

**Files:**
- Create: `src/components/ApuracaoPainel.jsx`

- [ ] **Step 1: Criar o componente**

Create `src/components/ApuracaoPainel.jsx`:
```jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { agregarVotos, percentualApurado } from '../lib/apuracao';
import * as XLSX from 'xlsx';

export default function ApuracaoPainel({ onVoltar }) {
  const [candidatos, setCandidatos] = useState([]);
  const [secoes, setSecoes] = useState([]);
  const [totalEsperado, setTotalEsperado] = useState(0);

  async function carregar() {
    const { data: cand } = await supabase.from('apuracao_candidatos').select('*').order('ordem');
    const { data: sec } = await supabase.from('apuracao_secao').select('*');
    const { count } = await supabase.from('locais_votacao').select('*', { count: 'exact', head: true });
    setCandidatos(cand || []);
    setSecoes(sec || []);
    setTotalEsperado(count || 0);
  }

  useEffect(() => {
    carregar();
    const canal = supabase.channel('apuracao')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apuracao_secao' }, () => carregar())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  const ag = useMemo(() => agregarVotos(secoes, candidatos), [secoes, candidatos]);
  const pct = percentualApurado(secoes.length, totalEsperado);

  function exportar() {
    const linhas = secoes.map(s => ({
      municipio: s.municipio, zona: s.zona, secao: s.secao,
      ...Object.fromEntries(candidatos.map(c => [c.nome, (s.votos || {})[c.id] || 0])),
      total: s.total_secao || '', status: s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Apuracao');
    XLSX.writeFile(wb, 'apuracao.xlsx');
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Apuração ao vivo</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportar} style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>⬇ Excel</button>
          {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Seções apuradas</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#CBA15C' }}>{secoes.length} / {totalEsperado} ({pct}%)</div>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Nosso candidato</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e' }}>{ag.nosso ? ag.nosso.votos.toLocaleString('pt-BR') : 0} votos</div>
        </div>
      </div>
      <h3 style={{ color: '#f1f5f9' }}>Ranking</h3>
      {ag.ranking.map((r, i) => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: r.eh_nosso ? '#14532d' : '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 12, marginBottom: 6 }}>
          <span style={{ color: '#f1f5f9' }}>{i + 1}º {r.eh_nosso ? '⭐ ' : ''}{r.nome}</span>
          <strong style={{ color: '#CBA15C' }}>{r.votos.toLocaleString('pt-BR')}</strong>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: conclui.

- [ ] **Step 3: Commit**

```bash
git add src/components/ApuracaoPainel.jsx
git commit -m "feat: painel de apuração ao vivo (Realtime + ranking + export)"
```

---

## FASE F — Integração no Dashboard

### Task 7: Ligar as 3 telas no DashboardCandidato

**Files:**
- Modify: `src/components/DashboardCandidato.jsx`

- [ ] **Step 1: Imports**

Adicionar após `import Broadcast from './Broadcast';`:
```jsx
import ApuracaoConfig from './ApuracaoConfig';
import ApuracaoLancamento from './ApuracaoLancamento';
import ApuracaoPainel from './ApuracaoPainel';
```

- [ ] **Step 2: Renders das abas**

Adicionar logo após a linha `if (aba === 'broadcast') return <Broadcast ... />;`:
```jsx
  if (aba === 'apuracao-config') return <ApuracaoConfig onVoltar={() => setAba('inicio')} />;
  if (aba === 'apuracao-lancar') return <ApuracaoLancamento perfil={perfil} onVoltar={() => setAba('inicio')} />;
  if (aba === 'apuracao-painel') return <ApuracaoPainel onVoltar={() => setAba('inicio')} />;
```

- [ ] **Step 3: Botões no menu**

Adicionar no array de botões (após `{ label: "📣 Enviar aviso", ... },`):
```jsx
          { label: "🗳️ Apuração (lançar)", onClick: () => setAba("apuracao-lancar") },
          { label: "📊 Apuração ao vivo", onClick: () => setAba("apuracao-painel") },
          { label: "⚙️ Apuração: candidatos", onClick: () => setAba("apuracao-config") },
```

- [ ] **Step 4: Build + testes**

Run: `npx vite build && npx vitest run`
Expected: build conclui; todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardCandidato.jsx
git commit -m "feat: integra apuração (lançar/painel/config) no dashboard"
```

---

## FASE G — Espelhar no Paulinho + publicar

### Task 8: Espelhar no app do Paulinho

- [ ] **Step 1: Migration no banco do Paulinho**

A migration `apuracao` e o bucket `boletins` já são aplicados no banco do Paulinho na Task 1 (os 2 bancos). Confirmar com `list_tables` no projeto `nhlidwbdjaapynbvyviy`.

- [ ] **Step 2: Espelhar o código**

Clonar limpo:
```bash
cd /c/Projetos
git clone --depth 1 https://github.com/andressasousa25as-spec/gabinete-digital.git _paulinho_deploy
```
Copiar do `gabinete-demo-real` (branch com a apuração) para `_paulinho_deploy`: `src/lib/apuracao.js`, `src/lib/apuracao.test.js`, `src/components/ApuracaoConfig.jsx`, `ApuracaoLancamento.jsx`, `ApuracaoPainel.jsx`, e `supabase/migrations/20260620120000_apuracao.sql`. Reaplicar as edições da Task 7 em `_paulinho_deploy/src/components/DashboardCandidato.jsx` (mesmas âncoras). `npm install` (idb/xlsx já presentes).

- [ ] **Step 3: Build, testes, push**

```bash
cd /c/Projetos/_paulinho_deploy
npx vitest run src/lib/apuracao.test.js
npx vite build
git add -A && git commit -m "feat: apuração paralela ao TSE (Fase 1)"
git push origin main
cd /c/Projetos && rm -rf _paulinho_deploy
```
Expected: deploy do Paulinho READY.

### Task 9: Verificação final (2 apps)

- [ ] **Step 1: Checklist em produção**

Em cada app: cadastrar candidatos acompanhados; lançar uma seção (online e offline → sincroniza); ver o painel somar ao vivo (abrir em duas abas para checar Realtime); duplicar uma seção (oferece substituir / marca conferir); exportar Excel.

---

## Notas de execução
- RLS de dados gateada por licença (`acesso_logado`), igual às demais tabelas.
- Migrations via Supabase MCP nos 2 bancos. Bucket `boletins` criado nos 2.
- Tudo nos 2 repos (demo master; Paulinho repo `gabinete-digital` branch `main`) — clonar limpo o do Paulinho; nunca usar `gabinete-digital-novo`.
- Fora de escopo (fases futuras): leitura de QR Code do boletim, feed oficial do TSE.
- **% apurado é aproximado:** o denominador usa a contagem de linhas de `locais_votacao` (locais), não o número exato de seções (um local tem várias). Suficiente para uma noção de progresso na Fase 1; refinar depois com a contagem real de seções esperadas por zona/município, se necessário.
