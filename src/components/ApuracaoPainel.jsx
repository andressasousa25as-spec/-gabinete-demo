import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { agregarVotos, percentualApurado } from '../lib/apuracao';
import * as XLSX from 'xlsx';

export default function ApuracaoPainel({ onVoltar }) {
  const [candidatos, setCandidatos] = useState([]);
  const [secoes, setSecoes] = useState([]);
  const [totalEsperado, setTotalEsperado] = useState(0);

  async function carregar() {
    const { data: cand } = await supabase.from('apuracao_candidatos').select('*').order('ordem');
    const { data: sec } = await supabase.from('apuracao_secao').select('*');
    const { count } = await supabase.from('locais_votacao').select('*', { count: 'exact', head: true });
    setCandidatos(cand || []);
    setSecoes(sec || []);
    setTotalEsperado(count || 0);
  }

  useEffect(() => {
    carregar();
    const canal = supabase.channel('apuracao')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apuracao_secao' }, () => carregar())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  const ag = useMemo(() => agregarVotos(secoes, candidatos), [secoes, candidatos]);
  const pct = percentualApurado(secoes.length, totalEsperado);

  function exportar() {
    const linhas = secoes.map(s => ({
      municipio: s.municipio, zona: s.zona, secao: s.secao,
      ...Object.fromEntries(candidatos.map(c => [c.nome, (s.votos || {})[c.id] || 0])),
      total: s.total_secao || '', status: s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Apuracao');
    XLSX.writeFile(wb, 'apuracao.xlsx');
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Apuração ao vivo</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportar} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>⬇ Excel</button>
          {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Seções apuradas</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#CBA15C' }}>{secoes.length} / {totalEsperado} ({pct}%)</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nosso candidato</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e' }}>{ag.nosso ? ag.nosso.votos.toLocaleString('pt-BR') : 0} votos</div>
        </div>
      </div>
      <h3 style={{ color: 'var(--text)' }}>Ranking</h3>
      {ag.ranking.map((r, i) => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: r.eh_nosso ? '#14532d' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--text)' }}>{i + 1}º {r.eh_nosso ? '⭐ ' : ''}{r.nome}</span>
          <strong style={{ color: '#CBA15C' }}>{r.votos.toLocaleString('pt-BR')}</strong>
        </div>
      ))}
    </div>
  );
}
