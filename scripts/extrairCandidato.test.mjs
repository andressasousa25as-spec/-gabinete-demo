import { describe, it, expect } from 'vitest';
import { extrairCandidato, gerarUpsertSQL } from './extrairCandidato.mjs';

const FONTE = [
  { nome: 'PAULO ALCEU AVILA RAMOS', cargo: 'DEPUTADO ESTADUAL', partido: 'MDB', total: 4880,
    municipios: { 'MACAPÁ': 4221 }, zonas: { '2': 1000 },
    secoes: [{ votos: 5, municipio: 'MACAPÁ', zona: '2', secao: '1', local: 'X', endereco: 'Y' }] },
];

describe('extrairCandidato', () => {
  it('acha por nome e tira local/endereco das secoes', () => {
    const c = extrairCandidato(FONTE, { nome: 'PAULO ALCEU', ano: 2022 });
    expect(c.nome).toBe('PAULO ALCEU AVILA RAMOS');
    expect(c.total).toBe(4880);
    expect(c.secoes[0]).toEqual({ votos: 5, municipio: 'MACAPÁ', zona: '2', secao: '1' });
    expect(c.secoes[0].local).toBeUndefined();
  });

  it('aplica nome de exibição quando passado', () => {
    const c = extrairCandidato(FONTE, { nome: 'PAULO ALCEU', ano: 2022, nomeExibicao: 'Deputado Demo', partido: 'XYZ' });
    expect(c.nome).toBe('Deputado Demo');
    expect(c.partido).toBe('XYZ');
  });

  it('retorna null se não achar', () => {
    expect(extrairCandidato(FONTE, { nome: 'FULANO', ano: 2022 })).toBeNull();
  });

  it('gera SQL com delete + insert (1 linha)', () => {
    const c = extrairCandidato(FONTE, { nome: 'PAULO ALCEU', ano: 2022 });
    const sql = gerarUpsertSQL(c);
    expect(sql).toContain('delete from public.analise_candidato;');
    expect(sql).toContain('insert into public.analise_candidato');
    expect(sql).toContain("'DEPUTADO ESTADUAL'");
  });
});
