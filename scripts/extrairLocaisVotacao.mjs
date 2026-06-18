// Extrai os locais de votação do Amapá do CSV do TSE Dados Abertos
// e gera src/lib/locaisVotacao.js. Uso:
//   node scripts/extrairLocaisVotacao.mjs /tmp/locais_tse/eleitorado_local_votacao_2024.csv
// Re-rodar quando sair a base oficial de 2026.
import fs from 'node:fs';
import path from 'node:path';

const IDX = { municipio: 8, zona: 9, secao: 10, local: 15, endereco: 18, bairro: 19 };

function parseLinha(linha) {
  // separador ';'; campos podem vir entre aspas. Sem ';' dentro de campo.
  return linha.split(';').map(c => c.replace(/^"|"$/g, '').trim());
}

export function extrair(conteudo) {
  const linhas = conteudo.split(/\r?\n/).filter(Boolean);
  const mapa = {};
  for (let i = 1; i < linhas.length; i++) {
    const col = parseLinha(linhas[i]);
    if (col.length < 20) continue;
    if (col[6] !== 'AP') continue; // SG_UF
    const z = parseInt(col[IDX.zona], 10);
    const s = parseInt(col[IDX.secao], 10);
    if (Number.isNaN(z) || Number.isNaN(s)) continue;
    mapa[`${z}-${s}`] = {
      local: col[IDX.local],
      bairro: col[IDX.bairro],
      municipio: col[IDX.municipio],
    };
  }
  return mapa;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const csvPath = process.argv[2];
  if (!csvPath) { console.error('Uso: node scripts/extrairLocaisVotacao.mjs <caminho-do-csv>'); process.exit(1); }
  const conteudo = fs.readFileSync(csvPath, 'latin1');
  const mapa = extrair(conteudo);
  const out = `// GERADO por scripts/extrairLocaisVotacao.mjs — NÃO editar à mão.
// Fonte: TSE Dados Abertos, eleitorado_local_votacao_2024 (Amapá). ${Object.keys(mapa).length} seções.
export const LOCAIS_VOTACAO = ${JSON.stringify(mapa, null, 0)};

// Nome do local de votação (escola) a partir de zona + seção do apoiador.
export function localDeVotacao(zona, secao) {
  if (zona == null || zona === '' || secao == null || secao === '') return null;
  const z = parseInt(String(zona).trim(), 10);
  const s = parseInt(String(secao).trim(), 10);
  if (Number.isNaN(z) || Number.isNaN(s)) return null;
  const rec = LOCAIS_VOTACAO[\`\${z}-\${s}\`];
  return rec ? rec.local : 'Local não localizado';
}
`;
  const destino = path.join(process.cwd(), 'src/lib/locaisVotacao.js');
  fs.writeFileSync(destino, out, 'utf8');
  console.log(`Gerado ${destino} com ${Object.keys(mapa).length} seções.`);
}
