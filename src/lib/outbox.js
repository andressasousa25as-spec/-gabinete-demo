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
    const q = supabase.from(item.tabela);
    if (item.op === 'insert') {
      const { error } = await q.insert(item.dados);
      if (error) throw error;
    } else if (item.op === 'update') {
      const { id, ...rest } = item.dados;
      const { error } = await q.update(rest).eq('id', id);
      if (error) throw error;
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

let _inst = null;
export async function getOutbox() {
  if (!_inst) _inst = criarOutbox({ store: await idbStore(), sender: supabaseSender });
  return _inst;
}

// Tenta gravar direto; se offline ou falha de rede, enfileira. Retorna { modo: 'online'|'fila' }.
export async function gravarResiliente({ tabela, op, dados }) {
  if (navigator.onLine) {
    const r = await supabaseSender({ tabela, op, dados });
    if (r.ok) return { modo: 'online' };
  }
  const ob = await getOutbox();
  await ob.enqueue({ tabela, op, dados });
  return { modo: 'fila' };
}
