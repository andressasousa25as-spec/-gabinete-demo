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

  it('reenvia item que estava em erro quando o envio passa', async () => {
    const sender = vi.fn().mockResolvedValue({ ok: false, erro: 'x' });
    const ob = criarOutbox({ store: memStore(), sender });
    await ob.enqueue({ tabela: 'eleitores', op: 'insert', dados: {} });
    await ob.sync();
    sender.mockResolvedValue({ ok: true });
    const r = await ob.sync();
    expect(r.enviados).toBe(1);
    expect(await ob.pendentes()).toBe(0);
  });
});
