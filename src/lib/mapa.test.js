import { describe, it, expect } from 'vitest';
import { linkMapaReuniao } from './mapa.js';

describe('linkMapaReuniao', () => {
  it('monta URL do Google Maps só com endereco + estado/pais', () => {
    const url = linkMapaReuniao({ endereco: 'Rua A, 100', local: 'Câmara' });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Rua A, 100, Amapá, Brasil'));
  });

  it('nao inclui o campo local (texto livre/assunto)', () => {
    const url = linkMapaReuniao({ endereco: 'Rua A, 100', local: 'TESTE' });
    expect(url).not.toContain('TESTE');
  });

  it('retorna null sem endereco', () => {
    expect(linkMapaReuniao({ local: 'Câmara' })).toBeNull();
    expect(linkMapaReuniao({})).toBeNull();
  });
});
