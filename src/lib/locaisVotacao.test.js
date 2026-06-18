import { describe, it, expect } from 'vitest';
import { localDeVotacao, LOCAIS_VOTACAO } from './locaisVotacao.js';

describe('localDeVotacao', () => {
  it('retorna null sem zona ou seção', () => {
    expect(localDeVotacao('', '')).toBeNull();
    expect(localDeVotacao(2, '')).toBeNull();
    expect(localDeVotacao(null, 5)).toBeNull();
  });
  it('normaliza zeros à esquerda da seção', () => {
    const chave = Object.keys(LOCAIS_VOTACAO)[0]; // "z-s"
    const [z, s] = chave.split('-');
    expect(localDeVotacao(z, '0' + s)).toBe(LOCAIS_VOTACAO[chave].local);
  });
  it('retorna aviso quando não encontra', () => {
    expect(localDeVotacao(99, 9999)).toBe('Local não localizado');
  });
});
