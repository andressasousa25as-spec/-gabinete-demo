import { describe, it, expect } from 'vitest';
import { coordConfiavel, centroBairro, dentroAmapa, distanciaKm } from './bairros';

describe('coordConfiavel', () => {
  it('rejeita coord no rio (caso Jadson, Trem) e usa o centro do bairro', () => {
    const ruim = { latitude: -0.038, longitude: -51.072 }; // ~7km ao sul, na água
    const r = coordConfiavel(ruim, 'Trem');
    expect(r).toEqual(centroBairro('Trem')); // [0.0254, -51.0618]
  });

  it('aceita endereço válido perto do centro do bairro', () => {
    const boa = { latitude: 0.026, longitude: -51.06 }; // ~0.2km do centro do Trem
    const r = coordConfiavel(boa, 'Trem');
    expect(r).toEqual(boa);
  });

  it('usa o centro do bairro quando não há coordenada', () => {
    expect(coordConfiavel(null, 'Buritizal')).toEqual(centroBairro('Buritizal'));
  });

  it('aceita coord no Amapá quando o bairro é desconhecido', () => {
    const fora = { latitude: 0.04, longitude: -51.18 }; // dentro do Amapá
    expect(coordConfiavel(fora, 'BairroInexistente')).toEqual(fora);
  });

  it('retorna null quando coord é inválida e bairro é desconhecido', () => {
    const oceano = { latitude: -20, longitude: -40 };
    expect(coordConfiavel(oceano, 'BairroInexistente')).toBeNull();
  });
});

describe('centroBairro — normalização e municípios', () => {
  it('acha o bairro ignorando acento e maiúsculas', () => {
    expect(centroBairro('açai')).toEqual(centroBairro('Açaí'));
    expect(centroBairro('JESUS DE NAZARE')).toEqual(centroBairro('Jesus de Nazaré'));
  });

  it('resolve apelidos ("Infraero" = Infraero 1, "Marabaixo II" = Marabaixo 2)', () => {
    expect(centroBairro('Infraero')).toEqual(centroBairro('Infraero 1'));
    expect(centroBairro('Marabaixo II')).toEqual(centroBairro('Marabaixo 2'));
  });

  it('Infraero 1 fica perto do aeroporto (~-51.065), não na zona rural oeste', () => {
    const c = centroBairro('Infraero 1');
    expect(c.longitude).toBeGreaterThan(-51.09); // a tabela antiga dizia -51.125 (errado)
  });

  it('homônimos: Novo Horizonte de Macapá ≠ Novo Horizonte de Santana', () => {
    const macapa = centroBairro('Novo Horizonte', 'Macapá');
    const santana = centroBairro('Novo Horizonte', 'Santana');
    expect(macapa.latitude).toBeGreaterThan(0);   // norte de Macapá
    expect(santana.latitude).toBeLessThan(0);     // Santana fica ao sul do equador
  });

  it('bairro de Santana resolve mesmo sem município (fallback entre tabelas)', () => {
    expect(centroBairro('Elesbão')).not.toBeNull();
  });
});

describe('dentroAmapa / distanciaKm', () => {
  it('Macapá está dentro do Amapá; latitude muito negativa não', () => {
    expect(dentroAmapa(0.035, -51.07)).toBe(true);
    expect(dentroAmapa(-20, -40)).toBe(false);
  });
  it('distância Trem→ponto no rio é maior que 5km', () => {
    expect(distanciaKm(0.035, -51.055, -0.028, -51.072)).toBeGreaterThan(5);
  });
});
