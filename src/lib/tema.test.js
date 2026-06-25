import { describe, it, expect } from 'vitest';
import { proximoTema, temaInicial } from './tema';

describe('tema', () => {
  it('alterna escuro <-> claro', () => {
    expect(proximoTema('dark')).toBe('light');
    expect(proximoTema('light')).toBe('dark');
  });
  it('default é escuro quando não há preferência salva', () => {
    expect(temaInicial(null)).toBe('dark');
    expect(temaInicial(undefined)).toBe('dark');
    expect(temaInicial('xpto')).toBe('dark');
  });
  it('respeita a preferência salva', () => {
    expect(temaInicial('light')).toBe('light');
    expect(temaInicial('dark')).toBe('dark');
  });
});
