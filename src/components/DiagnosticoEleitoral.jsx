import { useState, useMemo } from 'react';
import { useCandidatoTSE, calcularMetas, TOTAL_ELEITORES_AP } from '../hooks/useCandidatoTSE';
import { CANDIDATOS_TSE } from '../candidatosTSE';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

export default function DiagnosticoEleitoral({ onVoltar }) {
  const { candidato: candidatoAuto, loading, nomeBuscado } = useCandidatoTSE();
  const [candidatoManual, setCandidatoManual] = useState(null);
  const [busca, setBusca] = useState('');
  const [metaCustom, setMetaCustom] = useState(null);

  const candidato = candidatoAuto || candidatoManual;
  const metaDefault = candidato ? Math.round(candidato.total * 1.43) : 0;
  const meta = metaCustom || metaDefault;
  const { municipios } = useMemo(() => calcularMetas(candidato, meta), [candidato, meta]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;

  if (!candidato) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <div style={{ ...card, maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ color: azul, marginBottom: 8 }}>Selecione o Candidato</h2>
        {nomeBuscado && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>"{nomeBuscado}" nao encontrado. Selecione manualmente:</p>}
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANDIDATOS_TSE.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())).map(c => (
            <div key={c.nome} onClick={() => setCandidatoManual(c)}
              style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc' }}>
              <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{c.nome}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{c.cargo} - {c.total.toLocaleString('pt-BR')} votos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const percEleitorado = ((candidato.total / TOTAL_ELEITORES_AP) * 100).toFixed(2);
  const crescNecessario = (((meta - candidato.total) / candidato.total) * 100).toFixed(1);
  const municipioPrincipal = municipios[0];
  const percPrincipal = municipioPrincipal ? ((municipioPrincipal.votos2022 / candidato.total) * 100).toFixed(1) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(12px,4vw,32px)' }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <h1 style={{ color: azul, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Diagnostico Eleitoral</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>{candidato.nome} - TSE 2022</p>

      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Meta 2026</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={meta} onChange={e => setMetaCustom(Number(e.target.value))}
              style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '2px solid #93c5fd', background: '#eff6ff', fontSize: 18, fontWeight: 800, color: azul, textAlign: 'center' }} />
            <button onClick={() => setMetaCustom(metaDefault)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#64748b' }}>Reset</button>
          </div>
        </div>
        {[
          { l: 'Resultado 2022', v: candidato.total.toLocaleString('pt-BR'), c: '#1e293b' },
          { l: 'Crescimento necessario', v: '+' + crescNecessario + '%', c: '#16a34a' },
          { l: '% do eleitorado AP', v: percEleitorado + '%', c: '#7c3aed' },
        ].map((x, i) => (
          <div key={i} style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 16 }}>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{x.l}</p>
            <p style={{ color: x.c, fontSize: 22, fontWeight: 800, margin: 0 }}>{x.v}</p>
          </div>
        ))}
      </div>

      <div style={{ ...card }}>
        <h3 style={{ color: azul, marginBottom: 16 }}>Desempenho por Municipio</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['#','Municipio','Votos 2022','% Total','Meta 2026'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{municipios.map((m, i) => (
              <tr key={m.municipio}>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontWeight: 700 }}>{i+1}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b' }}>{m.municipio.charAt(0)+m.municipio.slice(1).toLowerCase()}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{m.votos2022.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', color: '#7c3aed', fontWeight: 700 }}>{m.perc}%</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', color: azul, fontWeight: 700 }}>{m.meta2026.toLocaleString('pt-BR')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <h3 style={{ color: azul, marginBottom: 12 }}>Analise Estrategica Automatica</h3>
        <ul style={{ color: '#1e40af', fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Base principal: <strong>{municipioPrincipal?.municipio.charAt(0)+municipioPrincipal?.municipio.slice(1).toLowerCase()}</strong> com {percPrincipal}% dos votos.</li>
          <li>Para {meta.toLocaleString('pt-BR')} votos, crescimento necessario: <strong>{crescNecessario}%</strong></li>
          <li>Representa <strong>{percEleitorado}%</strong> do eleitorado do estado.</li>
          <li>{Object.keys(candidato.municipios).length} municipios com presenca eleitoral.</li>
        </ul>
      </div>
    </div>
  );
}
