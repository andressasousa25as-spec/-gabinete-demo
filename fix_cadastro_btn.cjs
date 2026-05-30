const fs = require('fs');
const path = require('path');
const dashPath = path.join(__dirname, 'src', 'components', 'Dashboard.jsx');
let dash = fs.readFileSync(dashPath, 'utf8');

// Corrigir titulo com emoji
dash = dash.replace(
  '<h2 style={{ fontSize: 22, marginBottom: 20 }}>\uD83D\uDC65 Eleitores Cadastrados</h2>',
  '<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ fontSize: 22, margin: 0 }}>\uD83D\uDC65 Eleitores Cadastrados</h2>{perfil === "candidato" && <button onClick={() => setShowCadastro(true)} style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>+ Cadastrar</button>}</div>'
);

fs.writeFileSync(dashPath, dash, 'utf8');
console.log('OK: botao cadastrar adicionado');
