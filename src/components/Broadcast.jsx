import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Broadcast({ registrarLog, onVoltar }) {
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ titulo, corpo, url: '/' }),
      });
      const j = await r.json();
      if (registrarLog) registrarLog('Enviou aviso (push)', `${titulo} — ${j.enviados} destinatários`);
      alert(`Aviso enviado para ${j.enviados} aparelho(s).`);
      setTitulo(''); setCorpo('');
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      setEnviando(false);
    }
  }

  const inp = { width: '100%', padding: 10, marginBottom: 10, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' };
  return (
    <div style={{ padding: 30, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>🔔 Enviar aviso</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>}
      </div>
      <input placeholder="Título (ex: Reunião amanhã)" value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} />
      <textarea placeholder="Mensagem" value={corpo} onChange={e => setCorpo(e.target.value)} rows={4} style={inp} />
      <button onClick={enviar} disabled={enviando || !titulo} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '12px 30px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        {enviando ? 'Enviando...' : 'Disparar para todos'}
      </button>
    </div>
  );
}
