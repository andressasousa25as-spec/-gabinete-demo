const fs = require('fs');
const path = 'src/components/Dashboard.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Adicionar import do GestaoMidias
c = c.replace(
  "import PainelRastreamento from './PainelRastreamento';",
  "import PainelRastreamento from './PainelRastreamento';\nimport GestaoMidias from './GestaoMidias';"
);

// 2. Adicionar bloco da aba midias antes do bloco do mapa
c = c.replace(
  "{aba === 'mapa' && <MapaDemo token={MAPBOX_TOKEN} candidato={nomeAtual} />}",
  "{aba === 'midias' && <GestaoMidias onVoltar={() => setAba('inicio')} />\n        }\n        {aba === 'mapa' && <MapaDemo token={MAPBOX_TOKEN} candidato={nomeAtual} />}"
);

fs.writeFileSync(path, c, 'utf8');
console.log('OK - GestaoMidias adicionado');
