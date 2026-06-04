import { useState, useMemo } from 'react';
import { useCandidatoTSE, calcularMetas, MUNICIPIOS_AP } from '../hooks/useCandidatoTSE';
import { CANDIDATOS_TSE } from '../candidatosTSE';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

export default function RadarOportunidade({ onVoltar }) {
  const { candidato: auto, loading, nomeBuscado } = useCandidatoTSE();
  const [manual, setManual] = useState(null);
  const [busca, setBusca] = useState('');
  const [metaCustom, setMetaCustom] = useState(null);
  const candidato = auto || manual;
  const meta = metaCustom || (candidato ? Math.round(candidato.total * 1.43) : 0);
  const { municipios } = useMemo(() => calcularMetas(candidato, meta), [candidato, meta]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;
  if (!candidato) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <div style={{ ...card, maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ color: azul, marginBottom: 8 }}>Selecione o Candidato</h2>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANDIDATOS_TSE.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())).map(c => (
            <div key={c.nome} onClick={() => setManual(c)} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc' }}>
              <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{c.nome}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{c.cargo} - {c.total.toLocaleString('pt-BR')} votos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const oportunidades = municipios.map(m => {
    const info = MUNICIPIOS_AP[m.municipio] || { eleitores: 5000, abstencao: 0.22 };
    const pen = (m.votos2022 / info.eleitores) * 100;
    const disponiveis = Math.max(0, Math.round(info.eleitores * (1 - info.abstencao)) - m.votos2022);
    const score = Math.min(100, Math.max(0, Math.round((1 - pen / 20) * 100)));
    return { ...m, disponiveis, score };
  }).sort((a, b) => b.score - a.score);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(12px,4vw,32px)' }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <h1 style={{ color: azul, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Radar de Oportunidades</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>{candidato.nome} - Municipios com maior potencial</p>
      <div style={{ ...card }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {oportunidades.map((m, i) => (
            <div key={m.municipio} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#94a3b8', width: 24, fontWeight: 700 }}>{i+1}</span>
              <span style={{ color: '#1e293b', fontWeight: 600, minWidth: 160 }}>{m.municipio.charAt(0)+m.municipio.slice(1).toLowerCase()}</span>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 8 }}>
                  <div style={{ height: '100%', width: m.score+'%', background: m.score > 70 ? '#16a34a' : m.score > 40 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                </div>
              </div>
              <span style={{ color: m.score > 70 ? '#16a34a' : m.score > 40 ? '#f59e0b' : '#ef4444', fontWeight: 700, minWidth: 50 }}>{m.score}pts</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{m.disponiveis.toLocaleString('pt-BR')} votos disponiveis</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
