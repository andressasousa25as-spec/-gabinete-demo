import { describe, it, expect } from 'vitest';
import { linkMapaReuniao } from './mapa.js';

describe('linkMapaReuniao', () => {
  it('monta URL do Google Maps com endereco, local e Amapa', () => {
    const url = linkMapaReuniao({ endereco: 'Rua A, 100', local: 'Câmara' });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Rua A, 100, Câmara, Amapá, Brasil'));
  });

  it('ignora partes vazias', () => {
    const url = linkMapaReuniao({ endereco: 'Rua A, 100' });
    expect(url).toContain(encodeURIComponent('Rua A, 100, Amapá, Brasil'));
  });

  it('retorna null sem endereco', () => {
    expect(linkMapaReuniao({ local: 'Câmara' })).toBeNull();
    expect(linkMapaReuniao({})).toBeNull();
  });
});
