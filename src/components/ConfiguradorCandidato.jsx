import { useState, useMemo } from 'react';
import { CANDIDATOS_TSE } from '../candidatosTSE';
import { extrairCandidato } from '../lib/extrairCandidato';
import { supabase } from '../lib/supabase';

// Configurador de candidato (só master): busca a base TSE 2022 (AP) e grava em
// analise_candidato — alimenta todas as telas de análise. Estreante = limpa a análise.
export default function ConfiguradorCandidato({ atual }) {
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState(null);          // candidato TSE escolhido
  const [nomeExib, setNomeExib] = useState('');
  const [partido, setPartido] = useState('');
  const [salvando, setSalvando] = useState(false);

  const resultados = useMemo(() => {
    const q = busca.trim().toUpperCase();
    if (q.length < 2) return [];
    return CANDIDATOS_TSE
      .filter(c => (c.cargo || '').includes('DEPUTADO') && c.nome && c.nome.toUpperCase().includes(q))
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 20);
  }, [busca]);

  const escolher = (c) => {
    setSel(c);
    setNomeExib(c.nome);
    setPartido(c.partido || '');
  };

  const aplicar = async () => {
    if (!sel) return;
    setSalvando(true);
    try {
      const c = extrairCandidato(CANDIDATOS_TSE, { nome: sel.nome, ano: 2022, nomeExibicao: nomeExib || sel.nome, partido: partido || null });
      if (!c) { alert('Candidato não encontrado na base.'); setSalvando(false); return; }
      const del = await supabase.from('analise_candidato').delete().gte('ano', 0);
      if (del.error) throw del.error;
      const ins = await supabase.from('analise_candidato').insert([{
        ano: c.ano, cargo: c.cargo, nome: c.nome, partido: c.partido, numero: c.numero,
        total: c.total, municipios: c.municipios, zonas: c.zonas, secoes: c.secoes,
      }]);
      if (ins.error) throw ins.error;
      alert('✅ Candidato de análise configurado! O app vai recarregar.');
      window.location.reload();
    } catch (e) {
      alert('Erro ao salvar: ' + (e.message || e));
      setSalvando(false);
    }
  };

  const marcarEstreante = async () => {
    if (!confirm('Marcar como estreante / sem histórico? As telas de análise ficarão indisponíveis (o resto do app continua funcionando).')) return;
    setSalvando(true);
    try {
      const del = await supabase.from('analise_candidato').delete().gte('ano', 0);
      if (del.error) throw del.error;
      alert('✅ Marcado como sem histórico. O app vai recarregar.');
      window.location.reload();
    } catch (e) {
      alert('Erro: ' + (e.message || e));
      setSalvando(false);
    }
  };

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' };

  return (
    <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px' }}>CANDIDATO DE ANÁLISE (TSE 2022 · AP)</p>
      <p style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 10px' }}>
        {atual ? <>Atual: <strong>{atual.nome}</strong> · {atual.cargo} · {atual.ano} · {atual.total?.toLocaleString('pt-BR')} votos</> : 'Nenhum candidato configurado (telas de análise indisponíveis).'}
      </p>

      <input style={inp} placeholder="Buscar candidato pelo nome (TSE 2022)…" value={busca} onChange={e => { setBusca(e.target.value); setSel(null); }} />

      {busca.trim().length >= 2 && resultados.length === 0 && !sel && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '8px 0 0' }}>Nenhum candidato encontrado na base TSE 2022 (AP). Se for estreante, use o botão abaixo.</p>
      )}

      {!sel && resultados.length > 0 && (
        <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
          {resultados.map((c, i) => (
            <button key={i} onClick={() => escolher(c)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', padding: '8px 10px', cursor: 'pointer', fontSize: 13 }}>
              {c.nome} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {c.cargo} · {(c.total || 0).toLocaleString('pt-BR')} votos</span>
            </button>
          ))}
        </div>
      )}

      {sel && (
        <div style={{ marginTop: 10 }}>
          <p style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 8px' }}>Selecionado: <strong>{sel.nome}</strong> ({(sel.total || 0).toLocaleString('pt-BR')} votos)</p>
          <label style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 4 }}>Nome de exibição</label>
          <input style={{ ...inp, marginBottom: 8 }} value={nomeExib} onChange={e => setNomeExib(e.target.value)} />
          <label style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 4 }}>Partido (sigla)</label>
          <input style={{ ...inp, marginBottom: 10 }} value={partido} onChange={e => setPartido(e.target.value)} placeholder="Ex: UNIÃO" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={aplicar} disabled={salvando} style={{ flex: 1, padding: 10, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{salvando ? 'Salvando…' : '✅ Aplicar análise'}</button>
            <button onClick={() => setSel(null)} disabled={salvando} style={{ padding: 10, background: 'var(--surface-2)', color: 'var(--text)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <button onClick={marcarEstreante} disabled={salvando} style={{ marginTop: 10, width: '100%', padding: 9, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
        Candidato estreante / sem histórico TSE
      </button>
    </div>
  );
}
