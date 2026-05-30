const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const novasVars = `VITE_SUPABASE_URL=https://yemlhsidmlxzpqimewox.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbWxoc2lkbWx4enBxaW1ld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyODQsImV4cCI6MjA5NTU2OTI4NH0.Ee-uBX2SlZA4X_eKjsudPIfoMruoT4BUpUG_ZyazlZI`;
if (!envContent.includes('VITE_SUPABASE_URL')) {
  fs.writeFileSync(envPath, envContent.trimEnd() + '\n' + novasVars + '\n', 'utf8');
  console.log('OK: .env atualizado');
} else { console.log('OK: .env ja tem Supabase'); }

const libDir = path.join(__dirname, 'src', 'lib');
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

fs.writeFileSync(path.join(libDir, 'supabase.js'), `import { createClient } from '@supabase/supabase-js';\nexport const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);\n`, 'utf8');
console.log('OK: supabase.js criado');
const rastreamentoLib = `import { supabase } from './supabase';
export const gerarRef = (nome, telefone) => {
  const base = (nome + telefone).toLowerCase().replace(/[^a-z0-9]/g, '');
  return base.slice(0, 20) + Math.random().toString(36).slice(2, 6);
};
export const registrarClique = async ({ ref, nomeEleitor, telefone, utmSource }) => {
  try {
    await supabase.from('links_rastreados').insert({ ref, nome_eleitor: nomeEleitor, telefone, utm_source: utmSource || 'gabinete', utm_campaign: ref, user_agent: navigator.userAgent });
  } catch (err) { console.warn('[rastreamento]', err.message); }
};
export const capturarRefUrl = async () => {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) return;
  try { await supabase.from('links_rastreados').insert({ ref, utm_source: 'link_direto', utm_campaign: ref, user_agent: navigator.userAgent }); } catch (err) { console.warn(err.message); }
};
export const gerarLinkEleitor = (ref) => window.location.origin + '?ref=' + ref;
export const gerarLinkWhatsApp = (telefone, nomeEleitor, ref) => {
  const texto = 'Ola ' + nomeEleitor + '! Acesse: ' + window.location.origin + '?ref=' + ref;
  return 'https://wa.me/55' + telefone.replace(/\D/g, '') + '?text=' + encodeURIComponent(texto);
};`;
fs.writeFileSync(path.join(require('path').join(__dirname, 'src', 'lib'), 'rastreamento.js'), rastreamentoLib, 'utf8');
console.log('OK: rastreamento.js criado');
const componentsDir = path.join(__dirname, 'src', 'components');

fs.writeFileSync(path.join(componentsDir, 'LinkRastreavel.jsx'), `import { useState } from 'react';
import { gerarRef, gerarLinkEleitor, gerarLinkWhatsApp, registrarClique } from '../lib/rastreamento';
export default function LinkRastreavel({ eleitor }) {
  const [copiado, setCopiado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const ref = gerarRef(eleitor.nome, eleitor.telefone || '');
  const copiarLink = async () => {
    await navigator.clipboard.writeText(gerarLinkEleitor(ref));
    await registrarClique({ ref, nomeEleitor: eleitor.nome, telefone: eleitor.telefone, utmSource: 'link_copiado' });
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };
  const abrirWhatsApp = async () => {
    await registrarClique({ ref, nomeEleitor: eleitor.nome, telefone: eleitor.telefone, utmSource: 'whatsapp' });
    window.open(gerarLinkWhatsApp(eleitor.telefone, eleitor.nome, ref), '_blank');
    setEnviado(true); setTimeout(() => setEnviado(false), 2000);
  };
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      <button onClick={copiarLink} style={{ background: copiado ? '#16a34a' : '#1e40af', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{copiado ? 'Copiado!' : 'Copiar link'}</button>
      <button onClick={abrirWhatsApp} style={{ background: enviado ? '#15803d' : '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{enviado ? 'Enviado!' : 'WhatsApp rastreado'}</button>
    </div>
  );
}`, 'utf8');
console.log('OK: LinkRastreavel.jsx criado');
fs.writeFileSync(path.join(componentsDir, 'PainelRastreamento.jsx'), `import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
export default function PainelRastreamento({ onVoltar }) {
  const [cliques, setCliques] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('links_rastreados').select('*').order('criado_em', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (!error && data) setCliques(data); setLoading(false); });
  }, []);
  const totalHoje = cliques.filter(c => new Date(c.criado_em).toDateString() === new Date().toDateString()).length;
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24 }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Rastreamento de Links</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}><p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>Total de cliques</p><p style={{ color: '#60a5fa', fontSize: 32, fontWeight: 800, margin: 0 }}>{cliques.length}</p></div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}><p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>Hoje</p><p style={{ color: '#34d399', fontSize: 32, fontWeight: 800, margin: 0 }}>{totalHoje}</p></div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}><p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>Via WhatsApp</p><p style={{ color: '#f59e0b', fontSize: 32, fontWeight: 800, margin: 0 }}>{cliques.filter(c => c.utm_source === 'whatsapp').length}</p></div>
      </div>
      {loading ? <p style={{ color: '#64748b' }}>Carregando...</p> : cliques.length === 0 ? <p style={{ color: '#64748b' }}>Nenhum clique ainda.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cliques.map(c => (
            <div key={c.id} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div><p style={{ fontWeight: 600, margin: 0 }}>{c.nome_eleitor || 'Visitante'}</p><p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>ref: {c.ref} — via {c.utm_source}</p></div>
              <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`, 'utf8');
console.log('OK: PainelRastreamento.jsx criado');
let dash = fs.readFileSync(path.join(componentsDir, 'Dashboard.jsx'), 'utf8');
if (!dash.includes('LinkRastreavel')) {
  dash = dash.replace("import MapaDemo from './MapaDemo';", "import MapaDemo from './MapaDemo';\nimport LinkRastreavel from './LinkRastreavel';\nimport PainelRastreamento from './PainelRastreamento';");
  console.log('OK: imports adicionados');
}
if (!dash.includes("id: 'rastreamento'")) {
  dash = dash.replace("{ id: 'mapa', label: '\uD83D\uDDFA\uFE0F Mapa' },\n      ]", "{ id: 'mapa', label: '\uD83D\uDDFA\uFE0F Mapa' },\n        { id: 'rastreamento', label: '\uD83D\uDD17 Links' },\n      ]");
  console.log('OK: aba Links adicionada');
}
if (!dash.includes("aba === 'rastreamento'")) {
  dash = dash.replace("if (aba === 'midias')", "if (aba === 'rastreamento') return <div style={{ background: '#0f172a', minHeight: '100vh' }}><PainelRastreamento onVoltar={() => setAba('inicio')} /></div>;\n  if (aba === 'midias')");
  console.log('OK: tela rastreamento adicionada');
}
if (dash.includes('📲 WhatsApp')) {
  const idx = dash.indexOf('📲 WhatsApp');
  const start = dash.lastIndexOf('<a ', idx);
  const end = dash.indexOf('</a>', idx) + 4;
  dash = dash.slice(0, start) + '<LinkRastreavel eleitor={e} />' + dash.slice(end);
  console.log('OK: LinkRastreavel nos eleitores');
}
fs.writeFileSync(path.join(componentsDir, 'Dashboard.jsx'), dash, 'utf8');
console.log('OK: Dashboard.jsx atualizado');

let main = fs.readFileSync(path.join(__dirname, 'src', 'main.jsx'), 'utf8');
if (!main.includes('capturarRefUrl')) {
  main = "import { capturarRefUrl } from './lib/rastreamento';\n" + main;
  main = main.replace('ReactDOM.createRoot', 'capturarRefUrl();\nReactDOM.createRoot');
  fs.writeFileSync(path.join(__dirname, 'src', 'main.jsx'), main, 'utf8');
  console.log('OK: capturarRefUrl no main.jsx');
}
console.log('\nTudo pronto!');
