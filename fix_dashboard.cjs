const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// 1. Remover Meta: 7.000 votos do header
c = c.replace(
  "<p style={{ color: '#93c5fd', margin: '8px 0 0' }}>Meta: <strong>7.000 votos</strong> • Eleitores: {eleitores.length} • Lideranças: {liderancas.length}</p>",
  "<p style={{ color: '#93c5fd', margin: '8px 0 0' }}>Eleitores: {eleitores.length} • Lideranças: {liderancas.length}</p>"
);

// 2. Meta de eleitores editável - substituir card fixo
c = c.replace(
  "{card('Total de Eleitores', eleitores.length, 'Meta: 50.000', '#60a5fa')}",
  "{card('Total de Eleitores', eleitores.length, `Meta: ${metaEleitores.toLocaleString('pt-BR')}`, '#60a5fa')}"
);

// 3. Adicionar estado metaEleitores após os outros estados
c = c.replace(
  "const [termoAceito, setTermoAceito] = useState(false);",
  "const [termoAceito, setTermoAceito] = useState(false);\n  const [metaEleitores, setMetaEleitores] = useState(50000);"
);

// 4. Corrigir cores brancas dos títulos dos cards
c = c.replace(/color: '#1e293b'/g, "color: 'white'");
c = c.replace(/color: '#0f172a'/g, "color: 'white'");

fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('OK!');
