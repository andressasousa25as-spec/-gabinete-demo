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
