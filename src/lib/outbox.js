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
