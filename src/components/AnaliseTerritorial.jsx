import { useState, useMemo } from 'react';
import { useCandidatoTSE, calcularMetas, MUNICIPIOS_AP } from '../hooks/useCandidatoTSE';
import { CANDIDATOS_TSE } from '../candidatosTSE';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

export default function AnaliseTerritorial({ onVoltar }) {
  const { candidato: auto, loading, nomeBuscado } = useCandidatoTSE();
  const [manual, setManual] = useState(null);
  const [busca, setBusca] = useState(null);
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
        {nomeBuscado && <p style={{ color: '#ef4444', fontSize: 13 }}>"{nomeBuscado}" nao encontrado.</p>}
        <input placeholder="Buscar..." onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANDIDATOS_TSE.filter(c => !busca || c.nome.toLowerCase().includes(busca.toLowerCase())).map(c => (
            <div key={c.nome} onClick={() => setManual(c)}
              style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc' }}>
              <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{c.nome}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{c.cargo} - {c.total.toLocaleString('pt-BR')} votos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const dados = municipios.map(m => {
    const info = MUNICIPIOS_AP[m.municipio] || { eleitores: 5000, abstencao: 0.22 };
    const pen = ((m.votos2022 / info.eleitores) * 100).toFixed(1);
    const potencial = Math.round(info.eleitores * (1 - info.abstencao) * 0.08);
    const cl = pen >= 5 ? 'FORTE' : pen >= 2 ? 'MEDIO' : 'FRACO';
    const cor = cl === 'FORTE' ? '#16a34a' : cl === 'MEDIO' ? '#f59e0b' : '#ef4444';
    return { ...m, pen, potencial, cl, cor };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(12px,4vw,32px)' }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <h1 style={{ color: azul, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Analise Territorial</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>{candidato.nome} - Penetracao eleitoral por municipio</p>
      <div style={{ ...card }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['FORTE','#16a34a'],['MEDIO','#f59e0b'],['FRACO','#ef4444']].map(([l,c]) => (
            <span key={l} style={{ background: c+'22', color: c, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
              {l}: {dados.filter(m => m.cl === l).length} municipios
            </span>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Municipio','Votos 2022','Penetracao','Potencial','Classificacao'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{dados.map(m => (
              <tr key={m.municipio}>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b' }}>{m.municipio.charAt(0)+m.municipio.slice(1).toLowerCase()}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{m.votos2022.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: m.cor }}>{m.pen}%</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', color: azul }}>{m.potencial.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ background: m.cor+'22', color: m.cor, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{m.cl}</span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
