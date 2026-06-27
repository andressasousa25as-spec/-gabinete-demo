// Extrai 1 candidato de uma lista (formato candidatosTSE.js) e gera SQL de upsert.
// Função PURA (sem dependências de node) — usada tanto pelo script CLI quanto
// pelo configurador in-app (navegador).
export function extrairCandidato(fonte, { nome, numero, ano, cargo, nomeExibicao, partido }) {
  const alvo = fonte.find(c =>
    (numero && String(c.numero) === String(numero)) ||
    (nome && c.nome && c.nome.toUpperCase().includes(nome.toUpperCase()))
  );
  if (!alvo) return null;
  // Rollup compacto por município×zona (votos + nº de seções). Evita guardar
  // centenas de seções cruas; as telas só agregam por município e por zona.
  const roll = {};
  for (const s of alvo.secoes || []) {
    const k = `${s.municipio}|${s.zona}`;
    if (!roll[k]) roll[k] = { municipio: s.municipio, zona: s.zona, votos: 0, nsecoes: 0 };
    roll[k].votos += s.votos;
    roll[k].nsecoes += 1;
  }
  const secoes = Object.values(roll);
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
