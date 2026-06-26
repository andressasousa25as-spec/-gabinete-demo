import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Mapa de alvo -> papéis (perfis_usuarios.perfil). 'geral' = todos (sem filtro).
const ALVOS = {
  geral: { label: '📣 Todos (geral)', papeis: null },
  deputado: { label: '👤 Só o deputado', papeis: ['CANDIDATO', 'MASTER'] },
  equipe: { label: '👥 Só a equipe', papeis: ['EQUIPE', 'ADMIN'] },
};

export default function Broadcast({ registrarLog, onVoltar }) {
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [alvo, setAlvo] = useState('geral');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    try {
      // Resolve os destinatários conforme o alvo escolhido.
      let user_ids; // undefined = todos
      const papeis = ALVOS[alvo].papeis;
      if (papeis) {
        const { data: perfis, error } = await supabase
          .from('perfis_usuarios').select('user_id').in('perfil', papeis);
        if (error) throw error;
        user_ids = (perfis || []).map((p) => p.user_id).filter(Boolean);
        if (user_ids.length === 0) {
          alert('Nenhum usuário nesse grupo ainda.');
          setEnviando(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ titulo, corpo, url: '/', user_ids }),
      });
      const j = await r.json();
      if (registrarLog) registrarLog('Enviou aviso (push)', `[${ALVOS[alvo].label}] ${titulo} — ${j.enviados} destinatários`);
      alert(`Aviso enviado para ${j.enviados} aparelho(s).`);
      setTitulo(''); setCorpo('');
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      setEnviando(false);
    }
  }

  const inp = { width: '100%', padding: 10, marginBottom: 10, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, boxSizing: 'border-box' };
  return (
    <div style={{ padding: 30, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>🔔 Enviar aviso</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>}
      </div>

      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>Enviar para:</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(ALVOS).map(([chave, v]) => (
          <button key={chave} onClick={() => setAlvo(chave)} style={{
            flex: 1, minWidth: 130, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            border: alvo === chave ? '2px solid #CBA15C' : '1px solid var(--border)',
            background: alvo === chave ? '#CBA15C' : 'var(--bg)',
            color: alvo === chave ? '#0E2236' : 'var(--text)',
          }}>{v.label}</button>
        ))}
      </div>

      <input placeholder="Título (ex: Reunião amanhã)" value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} />
      <textarea placeholder="Mensagem" value={corpo} onChange={e => setCorpo(e.target.value)} rows={4} style={inp} />
      <button onClick={enviar} disabled={enviando || !titulo} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '12px 30px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        {enviando ? 'Enviando...' : `Disparar (${ALVOS[alvo].label})`}
      </button>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        ℹ️ O aviso chega só em quem instalou o app (deputado/equipe). Para falar com lideranças e apoiadores, use o <strong>Comunicado</strong> (WhatsApp).
      </p>
    </div>
  );
}
