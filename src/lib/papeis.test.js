import { describe, it, expect } from 'vitest';
import { PAPEIS, papelAtribuivel, papelFixo } from './papeis';

describe('papeis', () => {
  it('lista os 4 papeis', () => {
    expect(PAPEIS).toEqual(['MASTER', 'CANDIDATO', 'EQUIPE', 'ADMIN']);
  });
  it('so EQUIPE e ADMIN sao atribuiveis pelo master', () => {
    expect(papelAtribuivel('EQUIPE')).toBe(true);
    expect(papelAtribuivel('ADMIN')).toBe(true);
    expect(papelAtribuivel('MASTER')).toBe(false);
    expect(papelAtribuivel('CANDIDATO')).toBe(false);
    expect(papelAtribuivel('qualquer')).toBe(false);
  });
  it('MASTER e CANDIDATO sao fixos (nao bloqueaveis)', () => {
    expect(papelFixo('MASTER')).toBe(true);
    expect(papelFixo('CANDIDATO')).toBe(true);
    expect(papelFixo('EQUIPE')).toBe(false);
    expect(papelFixo('ADMIN')).toBe(false);
  });
});
