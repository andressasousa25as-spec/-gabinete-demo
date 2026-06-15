import { describe, it, expect } from 'vitest';
import { montarEstado } from './useCandidatoAnalise';

describe('montarEstado', () => {
  it('loading enquanto data=undefined', () => {
    expect(montarEstado(undefined)).toEqual({ candidato: null, loading: true, semDados: false });
  });
  it('semDados quando data=null (sem linha)', () => {
    expect(montarEstado(null)).toEqual({ candidato: null, loading: false, semDados: true });
  });
  it('entrega candidato quando há linha', () => {
    const row = { nome: 'X', total: 10, municipios: { A: 10 }, zonas: { '1': 10 }, secoes: [{ municipio: 'A', zona: '1', votos: 10, nsecoes: 1 }] };
    const e = montarEstado(row);
    expect(e.loading).toBe(false);
    expect(e.semDados).toBe(false);
    expect(e.candidato.total).toBe(10);
    expect(e.candidato.secoes).toHaveLength(1);
  });
});
