const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Usar indexOf para encontrar e substituir por posição
const startEquipe = c.indexOf('const abasEquipe = [');
const endEquipe = c.indexOf('];', startEquipe) + 2;
const oldEquipe = c.slice(startEquipe, endEquipe);

const newEquipe = oldEquipe.replace(
  "{ id: 'anotacoes'",
  "{ id: 'midias', label: '📱 Mídias' },\n    { id: 'relatorios', label: '🖨️ Relatórios' },\n    { id: 'anotacoes'"
);

// Usar indexOf para candidato
const startCandidato = c.indexOf('const abasCandidato = [');
const endCandidato = c.indexOf('];', startCandidato) + 2;
const oldCandidato = c.slice(startCandidato, endCandidato);
const newCandidato = oldCandidato.replace(
  "{ id: 'cenario'",
  "{ id: 'cenario'"
).replace(
  /\{ id: 'cenario'.*?\},\n  \];/s,
  (match) => match.replace('];', "{ id: 'relatorios', label: '🖨️ Relatórios' },\n  ];"
));

c = c.replace(oldEquipe, newEquipe);
c = c.replace(oldCandidato, newCandidato);

fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('OK!');
