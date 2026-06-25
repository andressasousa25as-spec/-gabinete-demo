import { useState, useMemo } from 'react';
import { destinatariosDaLideranca, montarMensagemComunicado } from '../lib/comunicado.js';

// Modal de comunicado segmentado: escolhe uma lideranca, monta a lista
// (lideranca + apoiadores dela), opcionalmente puxa uma reuniao agendada,
// e gera links wa.me por pessoa pra enviar pelo WhatsApp.
export default function Comunicado({ eleitores = [], liderancas = [], reunioes = [], onEnviar, onClose }) {
  const [liderId, setLiderId] = useState('');
  const [reuniaoId, setReuniaoId] = useState('');
  const [texto, setTexto] = useState('');
  const [desmarcados, setDesmarcados] = useState([]); // ids fora do envio
  const [links, setLinks] = useState([]);

  const lider = useMemo(() => liderancas.find(l => l.id === liderId) || null, [liderId, liderancas]);
  const reuniao = useMemo(() => reunioes.find(r => r.id === reuniaoId) || null, [reuniaoId, reunioes]);
  const destinatarios = useMemo(() => lider ? destinatariosDaLideranca(lider, eleitores) : [], [lider, eleitores]);
  const ativos = destinatarios.filter(p => !desmarcados.includes(p.id));

  const toggle = (id) => setDesmarcados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const todosMarcados = destinatarios.length > 0 && ativos.length === destinatarios.length;
  const alternarTodos = () => setDesmarcados(todosMarcados ? destinatarios.map(p => p.id) : []);

  const gerar = () => {
    if (!lider) return alert('❌ Escolha uma liderança.');
    if (ativos.length === 0) return alert('❌ Nenhum destinatário selecionado.');
    if (!reuniao && !texto.trim()) return alert('❌ Escreva a mensagem ou escolha uma reunião.');
    const gerados = ativos.map(p => {
      const numero = '55' + String(p.telefone).replace(/\D/g, '');
      const msg = montarMensagemComunicado({ nome: p.nome, reuniao, textoLivre: texto });
      return { nome: p.nome, url: `https://wa.me/${numero}?text=${encodeURIComponent(msg)}` };
    });
    setLinks(gerados);
    if (onEnviar) onEnviar({ lideranca: lider.nome, total: gerados.length });
  };

  const card = { background: 'var(--surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' };
  const sel = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, marginBottom: 12 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        <h2 style={{ color: 'var(--text)', margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>📣 Comunicado por liderança</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>Avise uma liderança e os apoiadores ligados a ela. Cada pessoa recebe um link de WhatsApp pra você enviar.</p>

        {links.length === 0 ? (
          <>
            <label style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>Liderança</label>
            <select value={liderId} onChange={e => { setLiderId(e.target.value); setDesmarcados([]); }} style={sel}>
              <option value="">— escolha —</option>
              {liderancas.filter(l => l.telefone).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>

            <label style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>Reunião (opcional — preenche a mensagem)</label>
            <select value={reuniaoId} onChange={e => setReuniaoId(e.target.value)} style={sel}>
              <option value="">— sem reunião —</option>
              {reunioes.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
            </select>

            <label style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>Mensagem {reuniao ? '(complemento opcional)' : ''}</label>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={3} placeholder="Escreva o comunicado..." style={{ ...sel, resize: 'vertical' }} />

            {lider && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>{ativos.length} de {destinatarios.length} destinatários</span>
                  {destinatarios.length > 0 && (
                    <button onClick={alternarTodos} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      {todosMarcados ? '✗ Desmarcar todos' : '✓ Marcar todos'}
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8, marginTop: 6 }}>
                  {destinatarios.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 12, fontSize: 13 }}>Sem destinatários com telefone.</p> :
                    destinatarios.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!desmarcados.includes(p.id)} onChange={() => toggle(p.id)} />
                        <span style={{ color: 'var(--text)', fontSize: 13 }}>{p.nome} <span style={{ color: 'var(--text-muted)' }}>· {p.tipo === 'lideranca' ? 'liderança' : 'apoiador'}</span></span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <button onClick={gerar} style={{ width: '100%', padding: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}>Gerar {ativos.length} link{ativos.length !== 1 ? 's' : ''}</button>
          </>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✅ {links.length} link{links.length !== 1 ? 's' : ''} — clique pra enviar pelo WhatsApp:</p>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#14271c', border: '1px solid #1f5132', borderRadius: 8, color: '#dcfce7', textDecoration: 'none', fontSize: 13 }}>
                  <span>{l.nome}</span><span style={{ color: '#4ade80', fontWeight: 700 }}>Enviar →</span>
                </a>
              ))}
            </div>
            <button onClick={() => setLinks([])} style={{ width: '100%', padding: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 10 }}>← Voltar</button>
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: 11, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Fechar</button>
      </div>
    </div>
  );
}
