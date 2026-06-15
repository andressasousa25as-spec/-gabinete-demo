// Uso: node scripts/importar-analise.mjs --nome "PAULO ALCEU" --ano 2022 \
//      [--numero N] [--cargo "DEPUTADO ESTADUAL"] [--nome-exibicao "Deputado Demo"] \
//      [--partido XYZ] [--out seed.sql]
// Gera um .sql de upsert (1 linha) para a tabela analise_candidato do banco do cliente.
import { writeFileSync } from 'node:fs';
import { extrairCandidato, gerarUpsertSQL } from './extrairCandidato.mjs';

function arg(flag, def) { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : def; }

const mod = await import('../src/candidatosTSE.js');
const fonte = mod.CANDIDATOS_TSE;

const c = extrairCandidato(fonte, {
  nome: arg('--nome'), numero: arg('--numero'), ano: parseInt(arg('--ano', '2022'), 10),
  cargo: arg('--cargo'), nomeExibicao: arg('--nome-exibicao'), partido: arg('--partido'),
});
if (!c) { console.error('Candidato não encontrado.'); process.exit(1); }
const sql = gerarUpsertSQL(c);
const out = arg('--out', 'seed-analise.sql');
writeFileSync(out, sql, 'utf-8');
console.log(`OK: ${c.nome} (${c.total} votos, ${c.secoes.length} seções) -> ${out}`);
