import { describe, it, expect } from 'vitest';
import { licencaVencida } from './licenca';

describe('licencaVencida', () => {
  const hoje = new Date('2026-06-11');
  it('valida quando status ativo e validade no futuro', () => {
    expect(licencaVencida({ status: 'ativo', validade: '2026-08-01' }, hoje)).toBe(false);
  });
  it('vencida quando validade no passado', () => {
    expect(licencaVencida({ status: 'ativo', validade: '2026-06-10' }, hoje)).toBe(true);
  });
  it('vencida quando status vencido mesmo com validade futura', () => {
    expect(licencaVencida({ status: 'vencido', validade: '2026-08-01' }, hoje)).toBe(true);
  });
  it('valida no ultimo dia (validade == hoje)', () => {
    expect(licencaVencida({ status: 'teste', validade: '2026-06-11' }, hoje)).toBe(false);
  });
  it('trata licenca ausente como vencida', () => {
    expect(licencaVencida(null, hoje)).toBe(true);
  });
});
