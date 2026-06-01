import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PainelRastreamento() {
  const [cliques, setCliques] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('links_rastreados').select('*').order('criado_em', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (!error && data) setCliques(data); setLoading(false); });
  }, []);

  const totalHoje = cliques.filter(c => new Date(c.criado_em).toDateString() === new Date().toDateString()).length;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 16, color: 'white' }}>Rastreamento de Links</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>Total de cliques</p>
          <p style={{ color: '#60a5fa', fontSize: 32, fontWeight: 800, margin: 0 }}>{cliques.length}</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>Hoje</p>
          <p style={{ color: '#34d399', fontSize: 32, fontWeight: 800, margin: 0 }}>{totalHoje}</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>Via WhatsApp</p>
          <p style={{ color: '#f59e0b', fontSize: 32, fontWeight: 800, margin: 0 }}>{cliques.filter(c => c.utm_source === 'whatsapp').length}</p>
        </div>
      </div>
      {loading ? <p style={{ color: '#64748b' }}>Carregando...</p> : cliques.length === 0 ? <p style={{ color: '#64748b' }}>Nenhum clique ainda.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cliques.map(c => (
            <div key={c.id} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, border: '1px solid #334155' }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0, color: '#f1f5f9' }}>{c.nome_eleitor || 'Visitante'}</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>ref: {c.ref} via {c.utm_source}</p>
              </div>
              <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}