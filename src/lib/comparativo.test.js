import { describe, it, expect } from 'vitest';
import { montarComparativo } from './comparativo.js';

const referencia = { nome: 'Paulinho', votos: 4880, abrangencia: 'Estado' };
const adversarios = [
  { id: '2', nome: 'Góes', votos: 6681, abrangencia: 'Estado' },
  { id: '3', nome: 'Ângelo', votos: 1205, abrangencia: 'Município' },
];

describe('montarComparativo', () => {
  it('usa a referência recebida (candidato configurado)', () => {
    const r = montarComparativo(adversarios, referencia);
    expect(r.referencia.nome).toBe('Paulinho');
    expect(r.semReferencia).toBe(false);
  });
  it('ordena os adversários por votos desc', () => {
    const r = montarComparativo(adversarios, referencia);
    expect(r.adversarios.map(a => a.nome)).toEqual(['Góes', 'Ângelo']);
  });
  it('calcula a diferença vs. referência (adversário - nosso)', () => {
    const r = montarComparativo(adversarios, referencia);
    expect(r.adversarios.find(a => a.nome === 'Góes').diff).toBe(1801);
    expect(r.adversarios.find(a => a.nome === 'Ângelo').diff).toBe(-3675);
  });
  it('marca comparacaoDireta apenas para mesma abrangência da referência', () => {
    const r = montarComparativo(adversarios, referencia);
    expect(r.adversarios.find(a => a.nome === 'Góes').comparacaoDireta).toBe(true);
    expect(r.adversarios.find(a => a.nome === 'Ângelo').comparacaoDireta).toBe(false);
  });
  it('ignora linhas legadas marcadas eh_nosso', () => {
    const r = montarComparativo([{ id: '1', nome: 'Velho Nosso', eh_nosso: true, votos: 9, abrangencia: 'Estado' }, ...adversarios], referencia);
    expect(r.adversarios.map(a => a.nome)).toEqual(['Góes', 'Ângelo']);
  });
  it('sem referência: retorna referencia null e flag', () => {
    const r = montarComparativo(adversarios, null);
    expect(r.referencia).toBe(null);
    expect(r.semReferencia).toBe(true);
  });
});
