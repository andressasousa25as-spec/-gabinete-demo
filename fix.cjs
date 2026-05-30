const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Adicionar import
if (!c.includes("import TermoLGPD")) {
  c = c.replace(
    "import MapaPage from '../MapaPage';",
    "import MapaPage from '../MapaPage';\nimport TermoLGPD from '../TermoLGPD';"
  );
}

// Substituir bloco do termo
const marker = "background: '#f0f9ff', border: '1px solid #bae6fd'";
const s = c.indexOf(marker);
if (s === -1) { console.log('TERMO NAO ENCONTRADO'); process.exit(1); }
const start = c.lastIndexOf('<div', s);
const end = c.indexOf('</div>', start) + 6;
const old = c.slice(start, end);
console.log('Substituindo bloco de', old.length, 'chars');
c = c.replace(old, '            <TermoLGPD aceito={termoAceito} onChange={setTermoAceito} />');

fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('OK!');
