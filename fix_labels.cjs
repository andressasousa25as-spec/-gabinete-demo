const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Encontrar e mostrar abasCandidato atual
const start = c.indexOf('const abasCandidato = [');
const end = c.indexOf('];', start) + 2;
console.log('ANTES:');
console.log(c.slice(start, end));

// Substituir labels corrompidos
c = c.replace("'?? Cen\u00E1rio'", "'\uD83D\uDCC8 Cen\u00E1rio'");
c = c.replace("'Relatorios'", "'\uD83D\uDDA8\uFE0F Relat\u00F3rios'");

// Verificar resultado
const start2 = c.indexOf('const abasCandidato = [');
const end2 = c.indexOf('];', start2) + 2;
console.log('\nDEPOIS:');
console.log(c.slice(start2, end2));

fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('\nOK!');
