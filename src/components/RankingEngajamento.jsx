import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RankingEngajamento({ onVoltar }) {
  const [ranking, setRanking] = useState([]);
  const [midias, setMidias] = useState([]);
  const [midiaFiltro, setMidiaFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');

  const cores = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

  useEffect(() => { carregar(); }, [midiaFiltro, periodo]);

  const carregar = async () => {
    setLoading(true);

    // Busca mídias para o filtro
    const { data: mData } = await supabase.from('midias').select('id, titulo').order('created_at', { ascending: false });
    setMidias(mData || []);

    // Busca cliques com lideranca_id
    let query = supabase.from('midias_cliques')
      .select('lideranca_id, midia_id, data_clique')
      .not('lideranca_id', 'is', null);

    if (midiaFiltro) query = query.eq('midia_id', midiaFiltro);

    if (periodo !== 'all') {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
      query = query.gte('data_clique', dataLimite.toISOString());
    }

    const { data: cliques } = await query;

    // Busca nomes das lideranças
    const { data: liderancas } = await supabase.from('liderancas').select('id, nome');

    if (!cliques || !liderancas) { setLoading(false); return; }

    // Agrupa cliques por liderança
    const contagem = {};
    cliques.forEach(c => {
      contagem[c.lideranca_id] = (contagem[c.lideranca_id] || 0) + 1;
    });

    // Monta ranking
    const rankingData = liderancas
      .map(l => ({
        id: l.id,
        nome: l.nome,
        cliques: contagem[l.id] || 0,
        nomeAbrev: l.nome.split(' ')[0],
      }))
      .sort((a, b) => b.cliques - a.cliques);

    setRanking(rankingData);
    setLoading(false);
  };

  const totalCliques = ranking.reduce((sum, r) => sum + r.cliques, 0);
  const medalhas = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>

      <h2 style={{ color: '#f59e0b', marginBottom: 24, fontSize: 24, fontWeight: 800 }}>🏆 Ranking de Engajamento</h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14 }}>
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="all">Todo o período</option>
        </select>
        <select value={midiaFiltro} onChange={e => setMidiaFiltro(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14, flex: 1 }}>
          <option value="">📤 Todas as mídias</option>
          {midias.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
        </select>
      </div>

      {/* Card total */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 24px', marginBottom: 24, border: '1px solid #334155', display: 'flex', gap: 32 }}>
        <div><p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>TOTAL DE CLIQUES</p>
          <p style={{ color: '#f59e0b', fontSize: 28, fontWeight: 800 }}>{totalCliques}</p></div>
        <div><p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>LIDERANÇAS ATIVAS</p>
          <p style={{ color: '#60a5fa', fontSize: 28, fontWeight: 800 }}>{ranking.filter(r => r.cliques > 0).length}</p></div>
        <div><p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>MÍDIAS DISPARADAS</p>
          <p style={{ color: '#10b981', fontSize: 28, fontWeight: 800 }}>{midias.length}</p></div>
      </div>

      {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>⏳ Carregando...</p> : (
        <>
          {/* Gráfico */}
          {ranking.some(r => r.cliques > 0) && (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
              <h3 style={{ color: '#f1f5f9', marginBottom: 16, fontSize: 15, fontWeight: 700 }}>📊 Comparativo de Cliques</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ranking} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nomeAbrev" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
                  <Bar dataKey="cliques" radius={[4, 4, 0, 0]}>
                    {ranking.map((_, i) => <Cell key={i} fill={cores[i % cores.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lista ranking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ranking.map((r, i) => (
              <div key={r.id} style={{ background: '#1e293b', borderRadius: 12, padding: '14px 20px', border: `1px solid ${i === 0 && r.cliques > 0 ? '#f59e0b' : '#334155'}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 24, width: 36 }}>{i < 3 && r.cliques > 0 ? medalhas[i] : `#${i + 1}`}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, margin: 0 }}>{r.nome}</p>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{r.cliques} clique{r.cliques !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: cores[i % cores.length], fontWeight: 800, fontSize: 22, margin: 0 }}>{r.cliques}</p>
                  {totalCliques > 0 && <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{((r.cliques / totalCliques) * 100).toFixed(1)}%</p>}
                </div>
                {/* Barra de progresso */}
                <div style={{ width: 80, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalCliques > 0 ? (r.cliques / ranking[0]?.cliques) * 100 : 0}%`, background: cores[i % cores.length], borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {ranking.every(r => r.cliques === 0) && (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>📭 Nenhum clique registrado ainda. Dispare mídias para começar!</p>
          )}
        </>
      )}
    </div>
  );
}
