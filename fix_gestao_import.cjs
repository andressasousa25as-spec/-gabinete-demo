const fs = require('fs');
let c = fs.readFileSync('src/components/GestaoMidias.jsx', 'utf8');

// Mostrar primeiras linhas
console.log('ANTES:');
console.log(c.slice(0, 200));

// Corrigir o import colado numa linha so
c = c.replace(
  "from 'react';\\nimport { supabase }",
  "from 'react';\nimport { supabase }"
);

// Se ainda nao tem import react separado, adicionar
if (!c.includes("from 'react';\nimport { supabase }") && !c.includes('from "react"')) {
  c = "import { useState, useEffect, useRef } from 'react';\n" + c;
}

console.log('\nDEPOIS:');
console.log(c.slice(0, 200));

fs.writeFileSync('src/components/GestaoMidias.jsx', c);
console.log('\nOK!');
