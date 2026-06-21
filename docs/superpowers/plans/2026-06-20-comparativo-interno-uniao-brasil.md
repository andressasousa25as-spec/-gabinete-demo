# Comparativo Interno (União Brasil) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quadro comparativo dos votos do Paulinho vs. os 16 adversários internos do União Brasil (cards de 2 por linha, diferença vs. Paulinho, selo de risco), com números reais do TSE semeados e tudo editável.

**Architecture:** Tabela `comparativo_internos` (semeada com os 17 + risco) + lógica pura `comparativo.js` (ordenação/diff/referência, testada) + tela `ComparativoInterno.jsx` (quadro) + `ComparativoInternoConfig.jsx` (edição). Espelhado nos 2 repos/2 bancos.

**Tech Stack:** React + Vite (JS), Supabase (Postgres), xlsx, vitest.

**Repos/bancos:** Primeiro em `gabinete-demo-real` (banco `yemlhsidmlxzpqimewox`); espelhar no Paulinho (repo `gabinete-digital` branch `main`, banco `nhlidwbdjaapynbvyviy`). Branch `feat/comparativo`; merge só com aprovação. Migration via MCP nos 2 bancos.

---

## File Structure
- `src/lib/comparativo.js` + `.test.js` — lógica pura (referência, ordenação, diff).
- `src/components/ComparativoInterno.jsx` — quadro (cards 2/linha).
- `src/components/ComparativoInternoConfig.jsx` — edição/CRUD.
- `supabase/migrations/20260620130000_comparativo_internos.sql` — tabela + RLS + seed.
- `src/components/DashboardCandidato.jsx` — imports + abas + botões.

---

## Task 1: Migration + seed (nos 2 bancos)

**Files:**
- Create: `supabase/migrations/20260620130000_comparativo_internos.sql`

- [ ] **Step 1: Escrever a migration**

Create `supabase/migrations/20260620130000_comparativo_internos.sql`:
```sql
create table if not exists public.comparativo_internos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  nome text not null,
  eh_nosso boolean default false,
  votos int default 0,
  cargo_ultima text,
  abrangencia text default '—',
  confirmado boolean default false,
  risco text default 'BAIXO' check (risco in ('ALTISSIMO','ALTO','MEDIO','BAIXO')),
  observacao text,
  ordem int default 0
);

create or replace function public.update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_comparativo_updated_at on public.comparativo_internos;
create trigger trg_comparativo_updated_at before update on public.comparativo_internos
  for each row execute function public.update_updated_at();

alter table public.comparativo_internos enable row level security;
drop policy if exists acesso_logado on public.comparativo_internos;
create policy acesso_logado on public.comparativo_internos for all to authenticated
  using (public.licenca_valida() or public.eh_master())
  with check (public.licenca_valida() or public.eh_master());

insert into public.comparativo_internos (nome, eh_nosso, votos, cargo_ultima, abrangencia, confirmado, risco, observacao, ordem) values
  ('Paulinho Ramos', true, 4880, 'Dep. Estadual 2022', 'Estado', true, 'BAIXO', 'Nosso candidato (referência).', 0),
  ('Roberto Góes', false, 6681, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Ex-prefeito; acima do Paulinho na mesma disputa.', 1),
  ('Rodolfo Vale', false, 5649, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Acima do Paulinho na disputa estadual.', 2),
  ('Jorge Amanajás', false, 5592, 'Dep. Estadual 2022', 'Estado', true, 'ALTISSIMO', 'Acima do Paulinho na disputa estadual.', 3),
  ('Aparecida Salomão', false, 4143, 'Dep. Estadual 2022', 'Estado', true, 'ALTO', 'Estadual encostada no Paulinho.', 4),
  ('Joselyo Mais Saúde', false, 2668, 'Vereador Macapá 2024', 'Município', true, 'ALTO', 'Vereador eleito; base municipal organizada.', 5),
  ('Faraó', false, 2413, 'Vereador Macapá 2024', 'Município', true, 'MEDIO', 'Base municipal relevante (UNIÃO).', 6),
  ('Alberto Negrão', false, 1803, 'Vereador Macapá 2024', 'Município', true, 'MEDIO', 'Base municipal.', 7),
  ('Engenheiro Ângelo', false, 1205, 'Vereador Macapá 2024', 'Município', true, 'MEDIO', 'Base municipal (UNIÃO).', 8),
  ('Samuel', false, 0, 'A confirmar', '—', false, 'MEDIO', 'A confirmar — NÃO é Josiel Alcolumbre; pode ser Samuel PDT vereador 2024 (3.088), não confirmado.', 9),
  ('Beth Pelaes', false, 0, 'Estreante (estadual)', '—', false, 'ALTO', 'Ex-prefeita de Pedra Branca do Amapari (2 mandatos) + forte alcance digital. Voto 0 não significa risco baixo.', 10),
  ('Bia Pombo', false, 0, 'Estreante', '—', false, 'BAIXO', 'Assistente social; sem histórico eleitoral medido.', 11),
  ('Ana Souza', false, 0, 'Estreante', '—', false, 'BAIXO', 'Esposa do prefeito de Vitória do Jari.', 12),
  ('Anderson Almeida', false, 0, 'Estreante', '—', false, 'BAIXO', 'Base em Santana (a confirmar).', 13),
  ('Roseli Matos', false, 0, 'Estreante', '—', false, 'BAIXO', 'A confirmar.', 14),
  ('Gracilene Barros', false, 0, 'Estreante', '—', false, 'BAIXO', 'A confirmar.', 15),
  ('Divino', false, 0, 'Estreante', '—', false, 'BAIXO', 'A confirmar.', 16);
```

- [ ] **Step 2: Aplicar nos 2 bancos via MCP**

`apply_migration` (name `comparativo_internos`) nos projetos `yemlhsidmlxzpqimewox` e `nhlidwbdjaapynbvyviy`. Verificar com `execute_sql`: `select count(*) from comparativo_internos;` → 17 nos dois.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260620130000_comparativo_internos.sql
git commit -m "feat: tabela comparativo_internos + RLS + seed dos 17 (União Brasil)"
```

## Task 2: Lógica pura `comparativo.js` (TDD)

**Files:**
- Create: `src/lib/comparativo.js`
- Test: `src/lib/comparativo.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/comparativo.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { montarComparativo } from './comparativo.js';

const lista = [
  { id: '1', nome: 'Paulinho', eh_nosso: true, votos: 4880, abrangencia: 'Estado' },
  { id: '2', nome: 'Góes', eh_nosso: false, votos: 6681, abrangencia: 'Estado' },
  { id: '3', nome: 'Ângelo', eh_nosso: false, votos: 1205, abrangencia: 'Município' },
];

describe('montarComparativo', () => {
  it('identifica a referência (eh_nosso)', () => {
    const r = montarComparativo(lista);
    expect(r.referencia.nome).toBe('Paulinho');
  });
  it('ordena os adversários por votos desc, sem a referência', () => {
    const r = montarComparativo(lista);
    expect(r.adversarios.map(a => a.nome)).toEqual(['Góes', 'Ângelo']);
  });
  it('calcula a diferença vs. referência (adversário - nosso)', () => {
    const r = montarComparativo(lista);
    const goes = r.adversarios.find(a => a.nome === 'Góes');
    expect(goes.diff).toBe(1801);
    const angelo = r.adversarios.find(a => a.nome === 'Ângelo');
    expect(angelo.diff).toBe(-3675);
  });
  it('marca comparacaoDireta apenas para mesma abrangência da referência', () => {
    const r = montarComparativo(lista);
    expect(r.adversarios.find(a => a.nome === 'Góes').comparacaoDireta).toBe(true);
    expect(r.adversarios.find(a => a.nome === 'Ângelo').comparacaoDireta).toBe(false);
  });
  it('sem referência: retorna referencia null e flag', () => {
    const r = montarComparativo([{ id: '9', nome: 'X', eh_nosso: false, votos: 10, abrangencia: 'Estado' }]);
    expect(r.referencia).toBe(null);
    expect(r.semReferencia).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/comparativo.test.js`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Create `src/lib/comparativo.js`:
```js
// Lógica pura do comparativo interno (sem banco/UI).
export function montarComparativo(lista) {
  const referencia = lista.find((c) => c.eh_nosso) || null;
  const base = referencia ? referencia.votos : 0;
  const adversarios = lista
    .filter((c) => !c.eh_nosso)
    .map((c) => ({
      ...c,
      diff: c.votos - base,
      comparacaoDireta: !!referencia && c.abrangencia === referencia.abrangencia,
    }))
    .sort((a, b) => b.votos - a.votos);
  return { referencia, adversarios, semReferencia: !referencia };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/comparativo.test.js`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/comparativo.js src/lib/comparativo.test.js
git commit -m "feat: lógica pura do comparativo interno (referência, ordenação, diff) com testes"
```

## Task 3: Quadro `ComparativoInterno.jsx`

**Files:**
- Create: `src/components/ComparativoInterno.jsx`

- [ ] **Step 1: Criar o componente**

Create `src/components/ComparativoInterno.jsx`:
```jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { montarComparativo } from '../lib/comparativo';
import * as XLSX from 'xlsx';

const CORES_RISCO = {
  ALTISSIMO: { bg: '#7f1d1d', fg: '#fecaca', label: 'Altíssimo' },
  ALTO: { bg: '#9a3412', fg: '#fed7aa', label: 'Alto' },
  MEDIO: { bg: '#854d0e', fg: '#fde68a', label: 'Médio' },
  BAIXO: { bg: '#334155', fg: '#cbd5e1', label: 'Baixo' },
};

export default function ComparativoInterno({ onVoltar }) {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from('comparativo_internos').select('*').order('ordem');
    setLista(data || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const { referencia, adversarios, semReferencia } = useMemo(() => montarComparativo(lista), [lista]);

  function exportar() {
    const linhas = lista.map(c => ({ nome: c.nome, votos: c.votos, cargo: c.cargo_ultima, abrangencia: c.abrangencia, risco: c.risco, confirmado: c.confirmado ? 'sim' : 'não' }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');
    XLSX.writeFile(wb, 'comparativo-interno.xlsx');
  }

  if (carregando) return <div style={{ padding: 30, color: '#94a3b8' }}>Carregando...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>🏆 Comparativo Interno — União Brasil</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportar} style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>⬇ Excel</button>
          {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
        </div>
      </div>

      {semReferencia && <p style={{ color: '#f87171' }}>Defina o candidato de referência (marque "nosso") na configuração.</p>}

      {referencia && (
        <div style={{ background: '#1e293b', border: '2px solid #CBA15C', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#CBA15C', fontWeight: 700 }}>⭐ NOSSO CANDIDATO (referência)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <span style={{ fontSize: 20, color: '#f1f5f9', fontWeight: 700 }}>{referencia.nome}</span>
            <span style={{ fontSize: 24, color: '#CBA15C', fontWeight: 800 }}>{referencia.votos.toLocaleString('pt-BR')} votos</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{referencia.cargo_ultima} · {referencia.abrangencia}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {adversarios.map(a => {
          const cor = CORES_RISCO[a.risco] || CORES_RISCO.BAIXO;
          const ahead = a.diff > 0; // adversário à frente do Paulinho = ameaça
          return (
            <div key={a.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>{a.nome}</span>
                <span style={{ background: cor.bg, color: cor.fg, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{cor.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '6px 0' }}>
                {a.confirmado ? a.votos.toLocaleString('pt-BR') + ' votos' : 'Estreante'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {a.cargo_ultima}{a.abrangencia !== 'Estado' && a.abrangencia !== '—' ? ` · ${a.abrangencia}` : ''}
              </div>
              {a.confirmado && a.comparacaoDireta && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: ahead ? '#f87171' : '#22c55e' }}>
                  {ahead ? '▲ +' : '▼ '}{a.diff.toLocaleString('pt-BR')} vs. nosso
                </div>
              )}
              {a.confirmado && !a.comparacaoDireta && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>cargo diferente — não comparável direto</div>
              )}
              {a.observacao && <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{a.observacao}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: conclui.

- [ ] **Step 3: Commit**

```bash
git add src/components/ComparativoInterno.jsx
git commit -m "feat: quadro do comparativo interno (cards 2/linha, diff, selo de risco)"
```

## Task 4: Edição `ComparativoInternoConfig.jsx`

**Files:**
- Create: `src/components/ComparativoInternoConfig.jsx`

- [ ] **Step 1: Criar o componente**

Create `src/components/ComparativoInternoConfig.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RISCOS = ['ALTISSIMO', 'ALTO', 'MEDIO', 'BAIXO'];

export default function ComparativoInternoConfig({ onVoltar }) {
  const [lista, setLista] = useState([]);

  async function carregar() {
    const { data } = await supabase.from('comparativo_internos').select('*').order('ordem');
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(item) {
    await supabase.from('comparativo_internos').update({
      votos: Number(item.votos) || 0,
      cargo_ultima: item.cargo_ultima,
      abrangencia: item.abrangencia,
      risco: item.risco,
      confirmado: item.confirmado,
      observacao: item.observacao,
    }).eq('id', item.id);
    carregar();
  }
  function setCampo(id, campo, valor) {
    setLista(lista.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  }

  const inp = { padding: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6, fontSize: 13 };
  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Editar comparativo</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
      </div>
      {lista.map(c => (
        <div key={c.id} style={{ background: c.eh_nosso ? '#1e293b' : '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <strong style={{ color: '#f1f5f9', minWidth: 140 }}>{c.eh_nosso ? '⭐ ' : ''}{c.nome}</strong>
          <input type="number" value={c.votos} onChange={e => setCampo(c.id, 'votos', e.target.value)} style={{ ...inp, width: 90 }} title="votos" />
          <input value={c.cargo_ultima || ''} onChange={e => setCampo(c.id, 'cargo_ultima', e.target.value)} style={{ ...inp, width: 160 }} title="cargo" />
          <select value={c.abrangencia || '—'} onChange={e => setCampo(c.id, 'abrangencia', e.target.value)} style={inp}>
            <option>Estado</option><option>Município</option><option>—</option>
          </select>
          <select value={c.risco} onChange={e => setCampo(c.id, 'risco', e.target.value)} style={inp}>
            {RISCOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>
            <input type="checkbox" checked={c.confirmado} onChange={e => setCampo(c.id, 'confirmado', e.target.checked)} /> confirmado
          </label>
          <input value={c.observacao || ''} onChange={e => setCampo(c.id, 'observacao', e.target.value)} style={{ ...inp, flex: 1, minWidth: 160 }} title="observação" />
          <button onClick={() => salvar(c)} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
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
git add src/components/ComparativoInternoConfig.jsx
git commit -m "feat: tela de edição do comparativo interno"
```

## Task 5: Integrar no Dashboard

**Files:**
- Modify: `src/components/DashboardCandidato.jsx`

- [ ] **Step 1: Imports**

Após `import ApuracaoPainel from './ApuracaoPainel';` adicionar:
```jsx
import ComparativoInterno from './ComparativoInterno';
import ComparativoInternoConfig from './ComparativoInternoConfig';
```

- [ ] **Step 2: Renders das abas**

Após a linha `if (aba === 'apuracao-painel') return <ApuracaoPainel ... />;` adicionar:
```jsx
  if (aba === 'comparativo') return <ComparativoInterno onVoltar={() => setAba('inicio')} />;
  if (aba === 'comparativo-config') return <ComparativoInternoConfig onVoltar={() => setAba('inicio')} />;
```

- [ ] **Step 3: Botões no menu**

Após a linha `{ label: "⚙️ Apuração: candidatos", onClick: () => setAba("apuracao-config") },` adicionar:
```jsx
          { label: "🏆 Comparativo Interno", onClick: () => setAba("comparativo") },
          { label: "✏️ Comparativo: editar", onClick: () => setAba("comparativo-config") },
```

- [ ] **Step 4: Build + testes**

Run: `npx vite build && npx vitest run`
Expected: build conclui; todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardCandidato.jsx
git commit -m "feat: integra comparativo interno (quadro + edição) no dashboard"
```

## Task 6: Espelhar no Paulinho + publicar

- [ ] **Step 1: Migration no banco do Paulinho** — já aplicada na Task 1 (os 2 bancos). Confirmar `select count(*) from comparativo_internos;` = 17 no `nhlidwbdjaapynbvyviy`.

- [ ] **Step 2: Espelhar o código**

Clonar limpo:
```bash
cd /c/Projetos
git clone --depth 1 https://github.com/andressasousa25as-spec/gabinete-digital.git _paulinho_deploy
cd _paulinho_deploy && npm install
```
Copiar de `gabinete-demo-real` (branch com o comparativo): `src/lib/comparativo.js`, `src/lib/comparativo.test.js`, `src/components/ComparativoInterno.jsx`, `src/components/ComparativoInternoConfig.jsx`, `supabase/migrations/20260620130000_comparativo_internos.sql`. Reaplicar as edições da Task 5 em `_paulinho_deploy/src/components/DashboardCandidato.jsx` (mesmas âncoras: import ApuracaoPainel, if aba apuracao-painel, botão "⚙️ Apuração: candidatos").

- [ ] **Step 3: Build, testes, push, limpar**

```bash
cd /c/Projetos/_paulinho_deploy
npx vitest run src/lib/comparativo.test.js
npx vite build
git add -A && git commit -m "feat: comparativo interno União Brasil (quadro + edição)"
git push origin main
cd /c/Projetos && rm -rf _paulinho_deploy
```
Expected: deploy do Paulinho READY.

## Task 7: Verificação final (2 apps)

- [ ] **Step 1: Checklist em produção**

Em cada app: abrir "🏆 Comparativo Interno" (Paulinho no topo dourado; cards 2/linha; Góes/Rodolfo/Jorge em vermelho "Altíssimo" à frente; vereadores com selo de cargo "não comparável direto"); abrir "✏️ Comparativo: editar", mudar um voto/risco e ver refletir no quadro; exportar Excel.

---

## Notas de execução
- RLS `acesso_logado` (licença). Migration via MCP nos 2 bancos. Seed dos 17 já vai na migration.
- 2 repos (demo master; Paulinho repo `gabinete-digital` branch `main`) — clonar limpo + `npm install` no clone.
- Métrica: votos da última eleição; diff vs. Paulinho só destacado para mesma abrangência (Estado). Vereador entra com selo. Risco em tiers editáveis.
