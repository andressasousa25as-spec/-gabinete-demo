const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

const oldEquipe = `const abasEquipe = [
    { id: 'inicio', label: '\uD83C\uDFE0 In\u00EDcio' },
    { id: 'eleitores', label: '\uD83D\uDC65 Eleitores' },
    { id: 'reunioes', label: '\uD83D\uDCC5 Reuni\u00F5es' },
    { id: 'mapa', label: '\uD83D\uDDFA\uFE0F Mapa' },
    { id: 'anotacoes', label: '\uD83D\uDCDD Anota\u00E7\u00F5es' },
  ];`;

const newEquipe = `const abasEquipe = [
    { id: 'inicio', label: '\uD83C\uDFE0 In\u00EDcio' },
    { id: 'eleitores', label: '\uD83D\uDC65 Eleitores' },
    { id: 'reunioes', label: '\uD83D\uDCC5 Reuni\u00F5es' },
    { id: 'mapa', label: '\uD83D\uDDFA\uFE0F Mapa' },
    { id: 'anotacoes', label: '\uD83D\uDCDD Anota\u00E7\u00F5es' },
    { id: 'midias', label: '\uD83D\uDCF1 M\u00EDdias' },
    { id: 'relatorios', label: '\uD83D\uDDA8\uFE0F Relat\u00F3rios' },
  ];`;

// Adicionar Relatorios no candidato tambem
const oldCenario = `{ id: 'cenario', label: '\uD83D\uDCC8 Cen\u00E1rio' },
  ];`;
const newCenario = `{ id: 'cenario', label: '\uD83D\uDCC8 Cen\u00E1rio' },
    { id: 'relatorios', label: '\uD83D\uDDA8\uFE0F Relat\u00F3rios' },
  ];`;

if (c.includes(oldEquipe)) {
  c = c.replace(oldEquipe, newEquipe);
  console.log('Equipe OK!');
} else {
  console.log('EQUIPE NAO ENCONTRADO');
}

if (c.includes(oldCenario)) {
  c = c.replace(oldCenario, newCenario);
  console.log('Candidato OK!');
} else {
  console.log('CANDIDATO NAO ENCONTRADO');
}

fs.writeFileSync('src/components/Dashboard.jsx', c);
