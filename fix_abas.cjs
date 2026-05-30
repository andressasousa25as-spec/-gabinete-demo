const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// 1. Adicionar Midias e Relatorios no perfil Equipe
c = c.replace(
  "{ id: 'anotacoes', label: '\uD83D\uDCDD Anota\u00E7\u00F5es' },\n  ];",
  "{ id: 'anotacoes', label: '\uD83D\uDCDD Anota\u00E7\u00F5es' },\n    { id: 'midias', label: '\uD83D\uDCF1 M\u00EDdias' },\n    { id: 'relatorios', label: '\uD83D\uDDA8\uFE0F Relat\u00F3rios' },\n  ];"
);

// 2. Adicionar Relatorios no perfil Candidato (depois de cenario)
c = c.replace(
  "{ id: 'cenario', label: '\uD83D\uDCC8 Cen\u00E1rio' },\n  ];",
  "{ id: 'cenario', label: '\uD83D\uDCC8 Cen\u00E1rio' },\n    { id: 'relatorios', label: '\uD83D\uDDA8\uFE0F Relat\u00F3rios' },\n  ];"
);

// 3. Adicionar tela de relatorios
const relaContent = `
  if (aba === 'relatorios') return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24 }}>
      <button onClick={() => setAba('inicio')} style={{ marginBottom: 20, padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
      <h2 style={{ color: 'white', marginBottom: 20 }}>🖨️ Relatórios</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Eleitores', dados: eleitores.map(e => ({ nome: e.nome, telefone: e.telefone || '-', bairro: e.bairro || '-', zona: e.zona_eleitoral ? 'Zona ' + e.zona_eleitoral : '-', secao: e.secao_eleitoral || '-' })), colunas: ['nome','telefone','bairro','zona','secao'] },
          { label: 'Lideranças', dados: liderancas.map(l => ({ nome: l.nome, telefone: l.telefone || '-', bairro: l.bairro || '-', demanda: l.demanda || '-' })), colunas: ['nome','telefone','bairro','demanda'] },
          { label: 'Reuniões', dados: reunioes.map(r => ({ titulo: r.titulo, data: r.data ? new Date(r.data).toLocaleString('pt-BR') : '-', local: r.local || '-' })), colunas: ['titulo','data','local'] },
          { label: 'Anotações', dados: anotacoes.map(a => ({ titulo: a.titulo, conteudo: a.conteudo || '-' })), colunas: ['titulo','conteudo'] },
        ].map((rel, i) => (
          <button key={i} onClick={() => {
            const w = window.open('', '_blank');
            const rows = rel.dados.map(d => '<tr>' + rel.colunas.map(c => '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">' + (d[c] || '-') + '</td>').join('') + '</tr>').join('');
            const headers = rel.colunas.map(c => '<th style="padding:10px 12px;background:#1e40af;color:white;text-align:left">' + c + '</th>').join('');
            w.document.write('<html><head><title>' + rel.label + '</title></head><body style="font-family:Arial;padding:20px"><h1 style="color:#1e40af">' + rel.label + '</h1><p>Total: ' + rel.dados.length + '</p><table style="width:100%;border-collapse:collapse"><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></body></html>');
            w.document.close();
            setTimeout(() => w.print(), 500);
          }} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, cursor: 'pointer', color: 'white', fontSize: 15, fontWeight: 700 }}>
            🖨️ {rel.label} ({rel.dados.length})
          </button>
        ))}
      </div>
    </div>
  );`;

c = c.replace(
  "  if (aba === 'midias') return",
  relaContent + "\n  if (aba === 'midias') return"
);

fs.writeFileSync('src/components/Dashboard.jsx', c);
console.log('OK!');
