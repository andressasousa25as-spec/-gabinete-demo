const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Remover o emoji e texto do span de perfil — deixar só "Candidato" ou "Equipe"
c = c.replace(
  /\{perfil === 'candidato' \? '.*?Candidato' : '.*?Equipe'\}/,
  "{perfil === 'candidato' ? 'Candidato' : 'Equipe'}"
);

fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('OK!');
