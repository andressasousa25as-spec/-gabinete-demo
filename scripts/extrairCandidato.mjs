// Extrai 1 candidato de uma lista (formato candidatosTSE.js) e gera SQL de upsert.
export function extrairCandidato(fonte, { nome, numero, ano, cargo, nomeExibicao, partido }) {
  const alvo = fonte.find(c =>
    (numero && String(c.numero) === String(numero)) ||
    (nome && c.nome && c.nome.toUpperCase().includes(nome.toUpperCase()))
  );
  if (!alvo) return null;
  const secoes = (alvo.secoes || []).map(s => ({
    votos: s.votos, municipio: s.municipio, zona: s.zona, secao: s.secao,
  }));
  return {
    ano,
    cargo: cargo || alvo.cargo,
    nome: nomeExibicao || alvo.nome,
    partido: partido || alvo.partido || null,
    numero: numero || alvo.numero || null,
    total: alvo.total || 0,
    municipios: alvo.municipios || {},
    zonas: alvo.zonas || {},
    secoes,
  };
}

const J = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;
const S = (v) => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;

export function gerarUpsertSQL(c) {
  return [
    'delete from public.analise_candidato;',
    'insert into public.analise_candidato (ano,cargo,nome,partido,numero,total,municipios,zonas,secoes) values (',
    `  ${c.ano}, ${S(c.cargo)}, ${S(c.nome)}, ${S(c.partido)}, ${S(c.numero)}, ${c.total},`,
    `  ${J(c.municipios)}, ${J(c.zonas)}, ${J(c.secoes)}`,
    ');',
  ].join('\n');
}
