import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function AnalyticsMidias({ onVoltar }) {
  const [midias, setMidias] = useState([]);
  const [cliques, setCliques] = useState([]);
  const [rastreamento, setRastreamento] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDados(); }, []);

  const fetchDados = async () => {
    const [m, c, r] = await Promise.all([
      supabase.from('midias').select('*').order('created_at', { ascending: false }),
      supabase.from('midias_cliques').select('*').order('data_clique', { ascending: false }),
      supabase.from('rastreamento_links').select('*').order('data_clique', { ascending: false }),
    ]);
    setMidias(m.data || []);
    setCliques(c.data || []);
    setRastreamento(r.data || []);
    setLoading(false);
  };

  const cliquesporMidia = (midiaId) => cliques.filter(c => c.midia_id === midiaId).length;

  const totalDisparos = rastreamento.filter(r => r.canal?.includes('whatsapp')).length;
  const totalInstagram = rastreamento.filter(r => r.canal === 'instagram').length;
  const totalLinktree = rastreamento.filter(r => r.canal === 'linktree').length;
  const totalMidias = cliques.length;

  const cliquesporBairro = cliques.reduce((acc, c) => {
    if (c.bairro && c.bairro !== 'disparo-whatsapp' && c.bairro !== 'disparo-manual') {
      acc[c.bairro] = (acc[c.bairro] || 0) + 1;
    }
    return acc;
  }, {});

  const disparosporCanal = rastreamento.reduce((acc, r) => {
    acc[r.canal] = (acc[r.canal] || 0) + 1;
    return acc;
  }, {});

  const icone = (tipo) => tipo === 'imagem' ? '🖼️' : tipo === 'video' ? '🎥' : tipo === 'pdf' ? '📄' : '📎';

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>⏳ Carregando analytics...</div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onVoltar} style={{ marginBottom: '20px', padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
        ← Voltar
      </button>

      <h2 style={{ color: '#1e40af', marginBottom: '24px', fontSize: '24px' }}>📊 Central de Analytics</h2>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '📤 Disparos WhatsApp', valor: totalDisparos, cor: '#25D366', bg: '#f0fdf4' },
          { label: '📸 Cliques Instagram', valor: totalInstagram, cor: '#dc2743', bg: '#fff1f2' },
          { label: '🌿 Cliques Linktree', valor: totalLinktree, cor: '#43E55E', bg: '#f0fdf4' },
          { label: '🖼️ Acessos Mídias', valor: totalMidias, cor: '#1e40af', bg: '#eff6ff' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '16px', padding: '20px', textAlign: 'center', border: `2px solid ${c.cor}22` }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: c.cor }}>{c.valor}</p>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Mídias com cliques */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginBottom: '16px' }}>🖼️ Mídias — Disparos por arquivo</h3>
        {midias.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>📭 Nenhuma mídia cadastrada.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {midias.map(m => {
              const total = cliquesporMidia(m.id);
              const pct = totalMidias > 0 ? Math.round((total / totalMidias) * 100) : 0;
              return (
                <div key={m.id} style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{icone(m.tipo)} {m.titulo}</p>
                    <span style={{ background: '#1e40af', color: 'white', borderRadius: '20px', padding: '2px 12px', fontSize: '13px', fontWeight: 'bold' }}>{total} disparos</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#1e40af', borderRadius: '4px', height: '8px', width: `${pct}%`, transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{new Date(m.created_at).toLocaleString('pt-BR')}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cliques por canal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a', marginBottom: '16px' }}>📣 Cliques por Canal</h3>
          {Object.keys(disparosporCanal).length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>Nenhum clique ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(disparosporCanal).sort((a, b) => b[1] - a[1]).map(([canal, total]) => (
                <div key={canal} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{canal}</span>
                  <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a', marginBottom: '16px' }}>📍 Cliques por Bairro</h3>
          {Object.keys(cliquesporBairro).length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>Nenhum clique por bairro ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(cliquesporBairro).sort((a, b) => b[1] - a[1]).map(([bairro, total]) => (
                <div key={bairro} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>📍 {bairro}</span>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Histórico recente */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a', marginBottom: '16px' }}>🕐 Histórico Recente de Cliques</h3>
        {rastreamento.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Nenhum clique registrado ainda.</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rastreamento.slice(0, 50).map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                <span style={{ color: '#374151' }}>📣 {r.canal}{r.bairro ? ` • 📍 ${r.bairro}` : ''}</span>
                <span style={{ color: '#9ca3af' }}>{new Date(r.data_clique).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
