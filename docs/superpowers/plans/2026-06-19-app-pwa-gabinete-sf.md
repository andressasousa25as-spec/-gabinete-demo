# App PWA Gabinete SF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o Gabinete Digital (web) em app instalável (PWA) com ícone Gabinete SF, sincronização offline das ações de campo (cadastro de eleitor e demanda) e notificações push.

**Architecture:** Adiciona `vite-plugin-pwa` (manifest + service worker Workbox) ao app React+Vite existente. A sincronização offline usa um módulo `outbox` puro (lógica testável + storage IndexedDB) com reenvio ao reconectar. Push usa Web Push (VAPID) com tabela `push_subscriptions`, Edge Function `send-push` e gatilhos (triggers + pg_cron) no Supabase.

**Tech Stack:** React 18, Vite, vite-plugin-pwa (Workbox), Supabase (Postgres, Edge Functions Deno, pg_cron, pg_net), Web Push API, IndexedDB, vitest.

**Repos/bancos:** Tudo é feito primeiro em `gabinete-demo-real` (repo `-gabinete-demo`, banco `yemlhsidmlxzpqimewox`) e depois espelhado no app do Paulinho (repo `gabinete-digital` branch `main`, banco `nhlidwbdjaapynbvyviy`). Ver passos de espelhamento ao fim de cada fase.

---

## File Structure

**Criados:**
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png` — ícones do app.
- `src/lib/outbox.js` — fila offline (lógica pura + IndexedDB). Responsabilidade: enfileirar/listar/reenviar gravações pendentes.
- `src/lib/outbox.test.js` — testes da lógica de fila.
- `src/hooks/useOnlineStatus.js` — estado de conexão + disparo de sync.
- `src/components/PendingBadge.jsx` — badge "N aguardando envio".
- `src/components/InstalarAppButton.jsx` — botão instalar (beforeinstallprompt).
- `src/lib/push.js` — assinatura push (permissão, subscribe, salvar).
- `src/components/Broadcast.jsx` — tela de aviso manual.
- `supabase/migrations/20260620100000_push_subscriptions.sql` — tabela + RLS.
- `supabase/migrations/20260620110000_push_triggers.sql` — triggers/cron dos avisos.
- `supabase/functions/send-push/index.ts` — Edge Function de envio.

**Modificados:**
- `vite.config.js` — registrar VitePWA.
- `index.html` — title "Gabinete SF", theme-color, apple-touch-icon, links de ícone.
- `src/CadastroEleitor.jsx` — usar outbox quando offline.
- `src/CadastroPublico.jsx` — usar outbox quando offline.
- `src/components/GestaoDemandas.jsx` — usar outbox em criar/mudar status quando offline.
- `package.json` — devDependency `vite-plugin-pwa`, dependency `idb`.

---

## FASE 1 — PWA base (instalável + ícone)

### Task 1: Instalar vite-plugin-pwa e idb

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar dependências**

Run:
```bash
cd /c/Projetos/gabinete-demo-real
npm install -D vite-plugin-pwa
npm install idb
```
Expected: pacotes adicionados sem erro.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: adiciona vite-plugin-pwa e idb"
```

### Task 2: Gerar ícones Gabinete SF

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png`
- Create (fonte): `public/icon-source.svg`

- [ ] **Step 1: Criar o SVG fonte do ícone**

Create `public/icon-source.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E7CC8A"/><stop offset="0.5" stop-color="#CBA15C"/><stop offset="1" stop-color="#9C6B2E"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="102" fill="#0E2236"/>
  <text x="256" y="332" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="252" font-weight="500" fill="url(#g)" letter-spacing="-12">SF</text>
  <rect x="136" y="372" width="240" height="11" rx="5" fill="url(#g)"/>
</svg>
```

- [ ] **Step 2: Gerar PNGs a partir do SVG**

Run (usa sharp via npx, sem instalar no projeto):
```bash
cd /c/Projetos/gabinete-demo-real
npx -y sharp-cli -i public/icon-source.svg -o public/icon-512.png resize 512 512
npx -y sharp-cli -i public/icon-source.svg -o public/icon-192.png resize 192 192
npx -y sharp-cli -i public/icon-source.svg -o public/apple-touch-icon.png resize 180 180
```
Expected: 3 PNGs criados. Se `sharp-cli` falhar no ambiente, alternativa: abrir o SVG no navegador e exportar manualmente, ou usar https://realfavicongenerator.net. Confirmar visualmente que o "SF" dourado aparece sobre azul-marinho.

- [ ] **Step 3: Gerar versão maskable (com margem de segurança)**

Create `public/icon-maskable-source.svg` (mesmo ícone com ~20% de respiro — o glifo ocupa a área central segura):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E7CC8A"/><stop offset="0.5" stop-color="#CBA15C"/><stop offset="1" stop-color="#9C6B2E"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#0E2236"/>
  <text x="256" y="312" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="200" font-weight="500" fill="url(#g)" letter-spacing="-10">SF</text>
  <rect x="161" y="346" width="190" height="9" rx="4" fill="url(#g)"/>
</svg>
```
Run:
```bash
npx -y sharp-cli -i public/icon-maskable-source.svg -o public/icon-512-maskable.png resize 512 512
```
Expected: PNG maskable criado.

- [ ] **Step 4: Commit**

```bash
git add public/icon-*.png public/icon-source.svg public/icon-maskable-source.svg public/apple-touch-icon.png
git commit -m "feat: ícones do app Gabinete SF (navy + dourado)"
```

### Task 3: Configurar VitePWA no vite.config.js

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Reescrever vite.config.js**

Replace `vite.config.js` content:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gabinete SF',
        short_name: 'Gabinete SF',
        description: 'Gestão de gabinete e base eleitoral',
        lang: 'pt-BR',
        display: 'standalone',
        background_color: '#0E2236',
        theme_color: '#0E2236',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.href.includes('/rest/v1/') && url.searchParams,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'supabase-get',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 2: Build para validar config**

Run:
```bash
npx vite build
```
Expected: build conclui e gera `dist/sw.js` e `dist/manifest.webmanifest`.

- [ ] **Step 3: Commit**

```bash
git add vite.config.js
git commit -m "feat: configura VitePWA (manifest + service worker)"
```

### Task 4: Atualizar index.html (título e theme)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Trocar título e adicionar meta de tema**

In `index.html`, replace:
```html
    <title>Gabinete Demo</title>
```
with:
```html
    <title>Gabinete SF</title>
    <meta name="theme-color" content="#0E2236" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Gabinete SF" />
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: título Gabinete SF + metas de app no index.html"
```

### Task 5: Botão "Instalar app"

**Files:**
- Create: `src/components/InstalarAppButton.jsx`
- Modify: `src/components/DashboardCandidato.jsx` (adicionar no menu)

- [ ] **Step 1: Criar o componente**

Create `src/components/InstalarAppButton.jsx`:
```jsx
import { useState, useEffect } from 'react';

export default function InstalarAppButton() {
  const [prompt, setPrompt] = useState(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalado(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (instalado || !prompt) return null;

  return (
    <button
      onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}
      style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
    >
      📲 Instalar app
    </button>
  );
}
```

- [ ] **Step 2: Importar e renderizar no Dashboard**

In `src/components/DashboardCandidato.jsx`, add after the `import Comunicado` lines:
```jsx
import InstalarAppButton from './InstalarAppButton';
```
Then add `{ label: <InstalarAppButton/>, ... }` is not valid in the botoes array; instead render `<InstalarAppButton />` near the top of the dashboard header. Locate the header `<div>` that holds the "Sair"/title (search `handleLogout` usage in JSX) and add `<InstalarAppButton />` adjacent to it.

- [ ] **Step 3: Build e verificação manual**

Run: `npx vite build && npx vite preview`
Expected: abrir no Chrome desktop → ícone de instalar na barra de endereço; no Android → botão "Instalar app" aparece. Confirmar instalação: ícone SF na tela, abre em tela cheia, splash azul-marinho.

- [ ] **Step 4: Commit**

```bash
git add src/components/InstalarAppButton.jsx src/components/DashboardCandidato.jsx
git commit -m "feat: botão Instalar app (PWA)"
```

### Task 6: Espelhar Fase 1 no app do Paulinho

- [ ] **Step 1: Clonar limpo e aplicar**

Run:
```bash
cd /c/Projetos
git clone --depth 1 https://github.com/andressasousa25as-spec/gabinete-digital.git _paulinho_deploy
```
Copiar os mesmos arquivos (ícones, vite.config.js, index.html — ajustando só `lang`/título se necessário, InstalarAppButton.jsx) e repetir as edições de DashboardCandidato.jsx (estrutura idêntica). Instalar deps: `cd _paulinho_deploy && npm install`.

- [ ] **Step 2: Build, commit, push, limpar**

```bash
cd /c/Projetos/_paulinho_deploy
npx vite build
git add -A && git commit -m "feat: PWA base Gabinete SF (instalável + ícone)"
git push origin main
cd /c/Projetos && rm -rf _paulinho_deploy
```
Expected: deploy do Paulinho READY na Vercel.

---

## FASE 2 — Offline outbox (ações de campo)

### Task 7: Módulo outbox — lógica de fila (TDD)

**Files:**
- Create: `src/lib/outbox.js`
- Test: `src/lib/outbox.test.js`

A lógica pura recebe um "store" injetável (para testar sem IndexedDB) e um "sender" (função que envia ao Supabase).

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/outbox.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { criarOutbox } from './outbox.js';

function memStore() {
  let itens = [];
  let seq = 1;
  return {
    async add(item) { const r = { ...item, id: seq++ }; itens.push(r); return r; },
    async all() { return [...itens]; },
    async remove(id) { itens = itens.filter(i => i.id !== id); },
    async update(id, patch) { itens = itens.map(i => i.id === id ? { ...i, ...patch } : i); },
  };
}

describe('outbox', () => {
  it('enfileira uma gravação e conta pendentes', async () => {
    const ob = criarOutbox({ store: memStore(), sender: vi.fn() });
    await ob.enqueue({ tabela: 'eleitores', op: 'insert', dados: { nome: 'Ana' } });
    expect(await ob.pendentes()).toBe(1);
  });

  it('sincroniza: envia e remove os itens enviados', async () => {
    const sender = vi.fn().mockResolvedValue({ ok: true });
    const ob = criarOutbox({ store: memStore(), sender });
    await ob.enqueue({ tabela: 'eleitores', op: 'insert', dados: { nome: 'Ana' } });
    await ob.enqueue({ tabela: 'demandas', op: 'insert', dados: { titulo: 'X' } });
    const r = await ob.sync();
    expect(sender).toHaveBeenCalledTimes(2);
    expect(r.enviados).toBe(2);
    expect(await ob.pendentes()).toBe(0);
  });

  it('mantém na fila e marca erro quando o envio falha', async () => {
    const sender = vi.fn().mockResolvedValue({ ok: false, erro: 'validação' });
    const ob = criarOutbox({ store: memStore(), sender });
    await ob.enqueue({ tabela: 'eleitores', op: 'insert', dados: {} });
    const r = await ob.sync();
    expect(r.enviados).toBe(0);
    expect(await ob.pendentes()).toBe(1);
    const itens = await ob.listar();
    expect(itens[0].status).toBe('erro');
  });

  it('não reenvia item já em erro de validação na mesma sync, mas conta como pendente', async () => {
    const sender = vi.fn().mockResolvedValue({ ok: false, erro: 'x' });
    const ob = criarOutbox({ store: memStore(), sender });
    await ob.enqueue({ tabela: 'eleitores', op: 'insert', dados: {} });
    await ob.sync();
    sender.mockResolvedValue({ ok: true });
    const r = await ob.sync();
    expect(r.enviados).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/outbox.test.js`
Expected: FAIL ("criarOutbox is not a function" / módulo inexistente).

- [ ] **Step 3: Implementar o módulo**

Create `src/lib/outbox.js`:
```js
// Fila de gravações offline (lógica pura).
// store: { add(item), all(), remove(id), update(id, patch) }
// sender: async (item) => ({ ok: boolean, erro?: string })
export function criarOutbox({ store, sender }) {
  async function enqueue({ tabela, op, dados }) {
    return store.add({ tabela, op, dados, status: 'pendente', criadoEm: Date.now() });
  }
  async function listar() { return store.all(); }
  async function pendentes() { return (await store.all()).length; }
  async function sync() {
    const itens = await store.all();
    let enviados = 0;
    for (const item of itens) {
      const r = await sender(item);
      if (r && r.ok) { await store.remove(item.id); enviados++; }
      else { await store.update(item.id, { status: 'erro', erro: r && r.erro }); }
    }
    return { enviados, restantes: (await store.all()).length };
  }
  return { enqueue, listar, pendentes, sync };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/outbox.test.js`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/outbox.js src/lib/outbox.test.js
git commit -m "feat: lógica de fila offline (outbox) com testes"
```

### Task 8: Storage IndexedDB + sender Supabase (binding de produção)

**Files:**
- Modify: `src/lib/outbox.js` (adicionar factory de produção)

- [ ] **Step 1: Adicionar store IndexedDB e sender Supabase**

Append to `src/lib/outbox.js`:
```js
import { openDB } from 'idb';
import { supabase } from './supabase';

async function idbStore() {
  const db = await openDB('gabinete-outbox', 1, {
    upgrade(d) { d.createObjectStore('fila', { keyPath: 'id', autoIncrement: true }); },
  });
  return {
    async add(item) { const id = await db.add('fila', item); return { ...item, id }; },
    async all() { return db.getAll('fila'); },
    async remove(id) { return db.delete('fila', id); },
    async update(id, patch) { const cur = await db.get('fila', id); await db.put('fila', { ...cur, ...patch }); },
  };
}

async function supabaseSender(item) {
  try {
    let q = supabase.from(item.tabela);
    if (item.op === 'insert') { const { error } = await q.insert(item.dados); if (error) throw error; }
    else if (item.op === 'update') { const { id, ...rest } = item.dados; const { error } = await q.update(rest).eq('id', id); if (error) throw error; }
    return { ok: true };
  } catch (e) { return { ok: false, erro: e.message }; }
}

let _inst = null;
export async function getOutbox() {
  if (!_inst) _inst = criarOutbox({ store: await idbStore(), sender: supabaseSender });
  return _inst;
}
```

- [ ] **Step 2: Build para garantir que importa**

Run: `npx vite build`
Expected: build conclui sem erro de import.

- [ ] **Step 3: Commit**

```bash
git add src/lib/outbox.js
git commit -m "feat: outbox storage IndexedDB + sender Supabase"
```

### Task 9: Hook de status online + badge de pendências

**Files:**
- Create: `src/hooks/useOnlineStatus.js`
- Create: `src/components/PendingBadge.jsx`

- [ ] **Step 1: Criar o hook**

Create `src/hooks/useOnlineStatus.js`:
```js
import { useState, useEffect } from 'react';
import { getOutbox } from '../lib/outbox';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendentes, setPendentes] = useState(0);

  async function atualizar() { const ob = await getOutbox(); setPendentes(await ob.pendentes()); }

  useEffect(() => {
    atualizar();
    const onUp = async () => { setOnline(true); const ob = await getOutbox(); await ob.sync(); atualizar(); };
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    const t = setInterval(atualizar, 5000);
    return () => { window.removeEventListener('online', onUp); window.removeEventListener('offline', onDown); clearInterval(t); };
  }, []);

  return { online, pendentes, atualizar };
}
```

- [ ] **Step 2: Criar o badge**

Create `src/components/PendingBadge.jsx`:
```jsx
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function PendingBadge() {
  const { online, pendentes } = useOnlineStatus();
  if (online && pendentes === 0) return null;
  return (
    <span style={{ background: online ? '#CBA15C' : '#64748b', color: '#0E2236', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
      {online ? `↑ ${pendentes} aguardando envio` : '⚠ sem conexão'}
    </span>
  );
}
```

- [ ] **Step 3: Renderizar o badge no header do Dashboard**

In `src/components/DashboardCandidato.jsx`, import and render `<PendingBadge />` near `<InstalarAppButton />` in the header.

- [ ] **Step 4: Build**

Run: `npx vite build`
Expected: conclui sem erro.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOnlineStatus.js src/components/PendingBadge.jsx src/components/DashboardCandidato.jsx
git commit -m "feat: status online + badge de pendências offline"
```

### Task 10: Integrar outbox no cadastro de eleitor e demandas

**Files:**
- Modify: `src/CadastroEleitor.jsx:58`
- Modify: `src/CadastroPublico.jsx:91`
- Modify: `src/components/GestaoDemandas.jsx` (funções `criarDemanda` e `mudarStatus`)

- [ ] **Step 1: Helper de gravação resiliente**

In `src/lib/outbox.js`, append:
```js
// Tenta gravar direto; se offline, enfileira. Retorna { modo: 'online'|'fila' }.
export async function gravarResiliente({ tabela, op, dados }) {
  if (navigator.onLine) {
    const r = await supabaseSender({ tabela, op, dados });
    if (r.ok) return { modo: 'online' };
  }
  const ob = await getOutbox();
  await ob.enqueue({ tabela, op, dados });
  return { modo: 'fila' };
}
```

- [ ] **Step 2: Usar em CadastroEleitor**

In `src/CadastroEleitor.jsx`, import `import { gravarResiliente } from './lib/outbox';` and replace the `await supabase.from('eleitores').insert({...})` block (line ~58) with:
```jsx
const r = await gravarResiliente({ tabela: 'eleitores', op: 'insert', dados: { /* mesmos campos do insert atual */ } });
if (r.modo === 'fila') alert('Sem internet — cadastro salvo e será enviado automaticamente ao reconectar.');
```
Manter exatamente os mesmos campos do insert original.

- [ ] **Step 3: Usar em CadastroPublico**

Same change in `src/CadastroPublico.jsx` (line ~91), keeping the original fields.

- [ ] **Step 4: Usar em GestaoDemandas**

In `src/components/GestaoDemandas.jsx`, in `criarDemanda` replace the `supabase.from('demandas').insert([...])` with `gravarResiliente({ tabela:'demandas', op:'insert', dados: {/* mesmo objeto */} })` and, when `modo==='fila'`, recarregar mostrando aviso. In `mudarStatus` replace the update with `gravarResiliente({ tabela:'demandas', op:'update', dados: { id: demanda.id, ...patch } })`. Import `gravarResiliente` from `../lib/outbox`.

- [ ] **Step 5: Build + verificação manual offline**

Run: `npx vite build && npx vite preview`
Expected: no DevTools → Network → Offline, cadastrar um eleitor mostra o aviso de fila e o badge incrementa; voltar online sincroniza e o badge zera.

- [ ] **Step 6: Commit**

```bash
git add src/CadastroEleitor.jsx src/CadastroPublico.jsx src/components/GestaoDemandas.jsx src/lib/outbox.js
git commit -m "feat: cadastro de eleitor e demandas funcionam offline (outbox)"
```

### Task 11: Espelhar Fase 2 no app do Paulinho

- [ ] **Step 1: Clonar, copiar libs/hooks/components, reaplicar edições, build, push, limpar**

Run (mesmo procedimento da Task 6): clonar `_paulinho_deploy`, `npm install idb`, copiar `src/lib/outbox.js`, `src/lib/outbox.test.js`, `src/hooks/useOnlineStatus.js`, `src/components/PendingBadge.jsx`, e reaplicar as integrações em CadastroEleitor/CadastroPublico/GestaoDemandas (estrutura idêntica). `npx vitest run src/lib/outbox.test.js` deve passar. Build, commit, `git push origin main`, remover a pasta temporária.

---

## FASE 3 — Infraestrutura de push

### Task 12: Migration push_subscriptions (nos 2 bancos)

**Files:**
- Create: `supabase/migrations/20260620100000_push_subscriptions.sql`

- [ ] **Step 1: Escrever a migration**

Create `supabase/migrations/20260620100000_push_subscriptions.sql`:
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_owner ON push_subscriptions;
CREATE POLICY push_owner ON push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Aplicar nos 2 bancos via MCP**

Aplicar `apply_migration` (name `push_subscriptions`) nos projetos `yemlhsidmlxzpqimewox` e `nhlidwbdjaapynbvyviy`. Verificar com `list_tables` que a tabela existe e RLS está ativo nos dois.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260620100000_push_subscriptions.sql
git commit -m "feat: tabela push_subscriptions (RLS por dono)"
```

### Task 13: Gerar chaves VAPID e configurar segredos

**Files:** nenhum no repo (apenas env/secrets)

- [ ] **Step 1: Gerar par VAPID**

Run:
```bash
npx -y web-push generate-vapid-keys
```
Expected: imprime `Public Key` e `Private Key`. Guardar ambas.

- [ ] **Step 2: Configurar no frontend (Vercel) e Supabase**

- Adicionar `VITE_VAPID_PUBLIC_KEY` (a pública) nas Environment Variables dos projetos Vercel `gabinete-demo` e `gabinete-digital-paulinho`, e no `.env` local de cada repo.
- Guardar a privada como secret na Edge Function (Task 14): `npx supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=... VAPID_SUBJECT=mailto:contato@gabinete` (por projeto).

Expected: variáveis presentes. (Sem commit de chaves.)

### Task 14: Edge Function send-push (nos 2 projetos)

**Files:**
- Create: `supabase/functions/send-push/index.ts`

- [ ] **Step 1: Escrever a função**

Create `supabase/functions/send-push/index.ts`:
```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  const { titulo, corpo, url, user_ids } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  let q = supabase.from('push_subscriptions').select('*');
  if (Array.isArray(user_ids) && user_ids.length) q = q.in('user_id', user_ids);
  const { data: subs } = await q;

  const payload = JSON.stringify({ titulo, corpo, url: url || '/' });
  let enviados = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      enviados++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', s.id);
      }
    }
  }
  return new Response(JSON.stringify({ enviados }), { headers: { 'Content-Type': 'application/json' } });
});
```

- [ ] **Step 2: Deploy nos 2 projetos**

Run (por projeto):
```bash
npx supabase functions deploy send-push --project-ref yemlhsidmlxzpqimewox
npx supabase functions deploy send-push --project-ref nhlidwbdjaapynbvyviy
```
Expected: deploy OK. (Requer `supabase login` e secrets da Task 13 setados em cada projeto.)

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-push/index.ts
git commit -m "feat: Edge Function send-push (Web Push VAPID)"
```

### Task 15: Service worker — receber e exibir push

**Files:**
- Create: `src/sw-push.js`
- Modify: `vite.config.js` (estratégia injectManifest OU importScripts)

- [ ] **Step 1: Adicionar handlers de push ao service worker**

Como o VitePWA usa `generateSW`, adicionar `importScripts` não é direto; usar a opção `workbox.importScripts`. In `vite.config.js`, dentro de `workbox`, add: `importScripts: ['/sw-push.js']`. Then create `public/sw-push.js`:
```js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.titulo || 'Gabinete SF', {
    body: data.corpo || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: `dist/sw.js` referencia `/sw-push.js`.

- [ ] **Step 3: Commit**

```bash
git add vite.config.js public/sw-push.js
git commit -m "feat: service worker exibe notificações push"
```

### Task 16: Frontend — assinar push

**Files:**
- Create: `src/lib/push.js`
- Modify: `src/components/DashboardCandidato.jsx` (pedir assinatura ao logar)

- [ ] **Step 1: Criar módulo push**

Create `src/lib/push.js`:
```js
import { supabase } from './supabase';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function ativarPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false, motivo: 'sem suporte' };
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, motivo: 'permissão negada' };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });
  const { data: { user } } = await supabase.auth.getUser();
  const json = sub.toJSON();
  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: 'endpoint' });
  return { ok: true };
}
```

- [ ] **Step 2: Botão "Ativar notificações" no Dashboard**

In `src/components/DashboardCandidato.jsx`, import `ativarPush` and add a botão no menu: `{ label: "🔔 Ativar avisos", onClick: async () => { const r = await ativarPush(); alert(r.ok ? 'Notificações ativadas!' : 'Não foi possível: ' + r.motivo); } }`.

- [ ] **Step 3: Build + teste manual**

Run: `npx vite build && npx vite preview`
Expected: clicar "Ativar avisos" → pedir permissão → linha criada em `push_subscriptions` (verificar via MCP `execute_sql`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/push.js src/components/DashboardCandidato.jsx
git commit -m "feat: ativar assinatura de push no frontend"
```

### Task 17: Teste ponta a ponta de um push manual

- [ ] **Step 1: Disparar a função manualmente**

Run:
```bash
curl -X POST "https://yemlhsidmlxzpqimewox.supabase.co/functions/v1/send-push" \
  -H "Authorization: Bearer <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"titulo":"Teste","corpo":"Olá do Gabinete SF","url":"/"}'
```
Expected: resposta `{"enviados":N}` e a notificação aparece no dispositivo que ativou.

---

## FASE 4 — Gatilhos dos avisos + broadcast

### Task 18: Habilitar pg_cron/pg_net e criar triggers (nos 2 bancos)

**Files:**
- Create: `supabase/migrations/20260620110000_push_triggers.sql`

- [ ] **Step 1: Escrever a migration**

Create `supabase/migrations/20260620110000_push_triggers.sql`:
```sql
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Função genérica que chama a Edge Function send-push.
-- A URL e a chave ficam em config do banco (current_setting), setadas após o deploy.
create or replace function public.disparar_push(titulo text, corpo text, url text, user_ids uuid[] default null)
returns void language plpgsql security definer as $$
declare
  fn_url text := current_setting('app.send_push_url', true);
  fn_key text := current_setting('app.send_push_key', true);
begin
  if fn_url is null then return; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||fn_key),
    body := jsonb_build_object('titulo',titulo,'corpo',corpo,'url',url,'user_ids',to_jsonb(user_ids))
  );
end $$;

-- Nova demanda
create or replace function public.trg_demanda_nova() returns trigger language plpgsql as $$
begin
  perform public.disparar_push('Nova demanda', coalesce(NEW.titulo,'Demanda registrada'), '/', null);
  return NEW;
end $$;
drop trigger if exists demanda_nova_push on public.demandas;
create trigger demanda_nova_push after insert on public.demandas
  for each row execute function public.trg_demanda_nova();

-- Novo cadastro de eleitor via público
create or replace function public.trg_eleitor_publico() returns trigger language plpgsql as $$
begin
  if NEW.origem_cadastro = 'publico' or NEW.origem = 'publico' then
    perform public.disparar_push('Novo cadastro', coalesce(NEW.nome,'Novo eleitor')||' se cadastrou', '/', null);
  end if;
  return NEW;
end $$;
drop trigger if exists eleitor_publico_push on public.eleitores;
create trigger eleitor_publico_push after insert on public.eleitores
  for each row execute function public.trg_eleitor_publico();

-- Demanda atrasada (diário às 12:00 UTC ~ 09:00 BRT)
select cron.schedule('demandas-atrasadas', '0 12 * * *', $$
  select public.disparar_push('Demanda atrasada', titulo||' venceu o prazo', '/', null)
  from public.demandas
  where prazo < current_date and status not in ('Resolvida','Cancelada');
$$);

-- Lembrete de reunião (a cada hora; reuniões nas próximas 24h)
select cron.schedule('reunioes-lembrete', '0 * * * *', $$
  select public.disparar_push('Reunião em breve', titulo||' às '||to_char(data,'DD/MM HH24:MI'), '/', null)
  from public.reunioes
  where data between now() and now() + interval '24 hours';
$$);
```

- [ ] **Step 2: Aplicar nos 2 bancos e setar config**

Aplicar `apply_migration` (name `push_triggers`) nos 2 projetos. Depois, em cada banco, rodar via `execute_sql` (com os valores reais):
```sql
alter database postgres set app.send_push_url = 'https://<ref>.supabase.co/functions/v1/send-push';
alter database postgres set app.send_push_key = '<ANON_KEY do projeto>';
```
Verificar `cron.job` criado (`select jobname from cron.job;`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260620110000_push_triggers.sql
git commit -m "feat: triggers e cron de notificações (demanda, eleitor, reunião)"
```

### Task 19: Tela de broadcast (aviso manual)

**Files:**
- Create: `src/components/Broadcast.jsx`
- Modify: `src/components/DashboardCandidato.jsx` (aba + botão; só candidato/adm/master)

- [ ] **Step 1: Criar a tela**

Create `src/components/Broadcast.jsx`:
```jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Broadcast({ registrarLog, onVoltar }) {
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ titulo, corpo, url: '/' }),
      });
      const j = await r.json();
      if (registrarLog) registrarLog('Enviou aviso (push)', `${titulo} — ${j.enviados} destinatários`);
      alert(`Aviso enviado para ${j.enviados} aparelho(s).`);
      setTitulo(''); setCorpo('');
    } catch (e) { alert('Erro ao enviar: ' + e.message); }
    finally { setEnviando(false); }
  }

  const inp = { width: '100%', padding: 10, marginBottom: 10, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' };
  return (
    <div style={{ padding: 30, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>🔔 Enviar aviso</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>}
      </div>
      <input placeholder="Título (ex: Reunião amanhã)" value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} />
      <textarea placeholder="Mensagem" value={corpo} onChange={e => setCorpo(e.target.value)} rows={4} style={inp} />
      <button onClick={enviar} disabled={enviando || !titulo} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '12px 30px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        {enviando ? 'Enviando...' : 'Disparar para todos'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Ligar no Dashboard**

In `src/components/DashboardCandidato.jsx`: import `Broadcast`; add render `if (aba === 'broadcast') return <Broadcast registrarLog={registrarLog} onVoltar={() => setAba('inicio')} />;`; add botão no menu visível só para candidato/adm/master: `...(ehMaster || perfilPapel ? [{ label: "🔔 Enviar aviso", onClick: () => setAba("broadcast") }] : [])` (usar a mesma checagem de papel já existente para a aba admins).

- [ ] **Step 3: Build + teste**

Run: `npx vite build && npx vite preview`
Expected: aba "Enviar aviso" dispara push para os aparelhos inscritos.

- [ ] **Step 4: Commit**

```bash
git add src/components/Broadcast.jsx src/components/DashboardCandidato.jsx
git commit -m "feat: tela de broadcast de avisos (push manual)"
```

### Task 20: Espelhar Fases 3 e 4 no app do Paulinho + deploy final

- [ ] **Step 1: Aplicar no repo/projeto do Paulinho**

Clonar `_paulinho_deploy`; copiar `src/lib/push.js`, `src/components/Broadcast.jsx`, `public/sw-push.js`, ajustes de `vite.config.js`, e reaplicar edições do DashboardCandidato.jsx. As migrations `push_subscriptions` e `push_triggers` já terão sido aplicadas no banco do Paulinho (Tasks 12 e 18). Garantir `VITE_VAPID_PUBLIC_KEY` na Vercel do Paulinho, secrets e config `app.send_push_url/key` no banco do Paulinho, e deploy da função `send-push` (Task 14) nesse projeto.

- [ ] **Step 2: Build, commit, push, limpar**

```bash
cd /c/Projetos/_paulinho_deploy
npx vite build
git add -A && git commit -m "feat: push (assinatura, broadcast, SW) Gabinete SF"
git push origin main
cd /c/Projetos && rm -rf _paulinho_deploy
```
Expected: deploy do Paulinho READY.

### Task 21: Verificação final (os 2 apps)

- [ ] **Step 1: Checklist em produção**

Em cada app (demo e Paulinho), confirmar:
- Instala (ícone SF, tela cheia, splash).
- Offline: cadastrar eleitor e atualizar demanda entram na fila; reconectar sincroniza (badge zera).
- Push: ativar avisos; criar demanda dispara notificação; broadcast chega.
- Lighthouse PWA: instalável, sem erros críticos.

---

## Notas de execução
- Cada fase é espelhada nos 2 repos e 2 bancos. Não pular o espelhamento.
- Migrations aplicadas via Supabase MCP (`apply_migration`) nos 2 projetos.
- Chaves VAPID e ANON keys nunca vão para o git.
- iOS: push só funciona com app instalado na tela inicial (iOS 16.4+). Documentar para os usuários.
- **Simplificação de destinatários:** como `demandas.responsavel` é texto livre (não FK de usuário), todos os gatilhos enviam para a equipe inteira do gabinete (`user_ids = null`), não para um responsável específico. Para roteamento por responsável no futuro, seria preciso converter `responsavel` em `responsavel_user_id` (FK). Diverge levemente do spec (seção 3.4) — registrado como decisão consciente.
