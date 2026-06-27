// Fonte única em src/lib/extrairCandidato.js (compartilhada com o app/navegador).
// Este arquivo re-exporta para manter o CLI (importar-analise.mjs) e os testes.
export { extrairCandidato, gerarUpsertSQL } from '../src/lib/extrairCandidato.js';
