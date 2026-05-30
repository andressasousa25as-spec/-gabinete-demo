const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Encontrar e mostrar abasEquipe atual
const start = c.indexOf('const abasEquipe = [');
const end = c.indexOf('];', start) + 2;
console.log('abasEquipe atual:');
console.log(c.slice(start, end));
