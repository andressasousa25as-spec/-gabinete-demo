const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Encontrar o label do cenario corrompido e substituir
const idx = c.indexOf("{ id: 'cenario'");
const lineEnd = c.indexOf('\n', idx);
const oldLine = c.slice(idx, lineEnd);
const newLine = "    { id: 'cenario', label: 'Cenario' },";

c = c.slice(0, idx) + newLine + c.slice(lineEnd);
fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('OK!');
