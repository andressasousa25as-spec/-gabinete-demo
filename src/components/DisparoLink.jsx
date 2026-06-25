import { useState } from 'react';

const BASE = 'https://gabinete-demo.vercel.app';
const ROTULO = { instagram: '📸 Instagram' };

// Gera links rastreados POR PESSOA de um canal (Instagram).
// Cada destinatário recebe um link /#/r/<canal>/<id> que, ao ser aberto,
// registra canal + quem + bairro + liderança e redireciona pro destino.
export default function DisparoLink({ canal, eleitores, liderancas, onClose }) {
  const [grupo, setGrupo] = useState('apoiadores'); // apoiadores | liderancas
  const [selecionados, setSelecionados] = useState([]);
  const [links, setLinks] = useState([]);

  const lista = (grupo === 'liderancas' ? liderancas : eleitores).filter(p => p.telefone);

  const toggle = (id) => setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const trocarGrupo = (g) => { setGrupo(g); setSelecionados((g === 'liderancas' ? liderancas : eleitores).filter(p => p.telefone).map(p => p.id)); setLinks([]); };
  const todos = () => setSelecionados(selecionados.length === lista.length ? [] : lista.map(p => p.id));

  const gerar = () => {
    if (selecionados.length === 0) return alert('❌ Selecione pelo menos um destinatário.');
    const alvos = lista.filter(p => selecionados.includes(p.id));
    const gerados = alvos.map(p => {
      const numero = '55' + p.telefone.replace(/\D/g, '');
      const rastreio = `${BASE}/#/r/${canal}/${p.id}`;
      const msg = `Olá, ${p.nome}!\n\nO *Deputado Demo* quer te mostrar uma novidade:\n\n${rastreio}\n\nPara sair, responda *SAIR*.`;
      return { nome: p.nome, url: `https://wa.me/${numero}?text=${encodeURIComponent(msg)}` };
    });
    setLinks(gerados);
  };

  const card = { background: 'var(--surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        <h2 style={{ color: 'var(--text)', margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>🎯 Gerar links rastreados — {ROTULO[canal]}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>Cada pessoa recebe um link único. Quando abrir, registramos quem, bairro e liderança.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[{ k: 'apoiadores', l: '👤 Apoiadores' }, { k: 'liderancas', l: '⭐ Lideranças' }].map(g => (
            <button key={g.k} onClick={() => trocarGrupo(g.k)}
              style={{ flex: 1, padding: 9, borderRadius: 8, border: grupo === g.k ? '2px solid #3b82f6' : '1px solid var(--border)', background: grupo === g.k ? 'var(--surface-2)' : 'transparent', color: grupo === g.k ? 'var(--text)' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{g.l}</button>
          ))}
        </div>

        {links.length === 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>{selecionados.length} de {lista.length} selecionados</span>
              <button onClick={todos} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {selecionados.length === lista.length ? '✗ Desmarcar todos' : '✓ Selecionar todos'}
              </button>
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8, marginBottom: 16 }}>
              {lista.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16, fontSize: 13 }}>Nenhum destinatário com telefone neste grupo.</p> :
                lista.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selecionados.includes(p.id)} onChange={() => toggle(p.id)} />
                    <span style={{ color: 'var(--text)', fontSize: 13 }}>{p.nome} {p.bairro ? <span style={{ color: 'var(--text-muted)' }}>· {p.bairro}</span> : null}</span>
                  </label>
                ))}
            </div>
            <button onClick={gerar} style={{ width: '100%', padding: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}>Gerar {selecionados.length} link{selecionados.length !== 1 ? 's' : ''}</button>
          </>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✅ {links.length} link{links.length !== 1 ? 's' : ''} gerado{links.length !== 1 ? 's' : ''} — clique pra enviar pelo WhatsApp:</p>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#14271c', border: '1px solid #1f5132', borderRadius: 8, color: '#dcfce7', textDecoration: 'none', fontSize: 13 }}>
                  <span>{l.nome}</span><span style={{ color: '#4ade80', fontWeight: 700 }}>Enviar →</span>
                </a>
              ))}
            </div>
            <button onClick={() => setLinks([])} style={{ width: '100%', padding: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 10 }}>← Voltar à seleção</button>
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: 11, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Fechar</button>
      </div>
    </div>
  );
}
