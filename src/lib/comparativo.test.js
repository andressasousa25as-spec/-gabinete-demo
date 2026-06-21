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
    expect(r.adversarios.find(a => a.nome === 'Góes').diff).toBe(1801);
    expect(r.adversarios.find(a => a.nome === 'Ângelo').diff).toBe(-3675);
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
