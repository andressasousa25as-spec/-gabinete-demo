const fs = require('fs');
const path = 'src/components/Dashboard.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Corrigir label da aba Liderancas
c = c.replace("{ id: 'liderancas', label: 'Liderancas' }", "{ id: 'liderancas', label: 'Lideranças' }");

// 2. Corrigir título h2 Liderancas
c = c.replace(">Liderancas<", ">Lideranças<");

// 3. Adicionar aba Midias no menu candidato (antes de rastreamento)
c = c.replace(
  "{ id: 'rastreamento', label: 'Links' },",
  "{ id: 'midias', label: 'Mídias' },\n        { id: 'rastreamento', label: 'Links' },"
);

fs.writeFileSync(path, c, 'utf8');
console.log('OK - Dashboard corrigido');
