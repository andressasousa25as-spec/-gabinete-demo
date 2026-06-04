import { useState, useMemo } from 'react';
import { useCandidatoTSE, calcularMetas } from '../hooks/useCandidatoTSE';
import { CANDIDATOS_TSE } from '../candidatosTSE';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

export default function MapaEleitoral({ onVoltar }) {
  const { candidato: auto, loading, nomeBuscado } = useCandidatoTSE();
  const [manual, setManual] = useState(null);
  const [busca, setBusca] = useState('');
  const [municipioSel, setMunicipioSel] = useState(null);
  const [metaCustom, setMetaCustom] = useState(null);
  const [ordem, setOrdem] = useState('votos');

  const candidato = auto || manual;
  const meta = metaCustom || (candidato ? Math.round(candidato.total * 1.43) : 0);
  const { municipios } = useMemo(() => calcularMetas(candidato, meta), [candidato, meta]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;

  if (!candidato) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: 24 }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <div style={{ ...card, maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ color: azul, marginBottom: 8 }}>Selecione o Candidato</h2>
        {nomeBuscado && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>"{nomeBuscado}" nao encontrado.</p>}
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANDIDATOS_TSE.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())).map(c => (
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

  if (municipioSel) {
    const m = municipios.find(x => x.municipio === municipioSel);
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px' }}>
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setMunicipioSel(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Municipios</button>
          <span style={{ color: '#64748b' }}>/</span>
          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{m.municipio}</span>
        </div>
        <div style={{ padding: '24px 32px' }}>
          <div style={{ ...card }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
              {[
                { l: 'Votos 2022', v: m.votos2022.toLocaleString('pt-BR'), c: azul },
                { l: 'Meta 2026', v: m.meta2026.toLocaleString('pt-BR'), c: '#16a34a' },
                { l: '% do Total', v: m.perc + '%', c: '#7c3aed' },
                { l: 'Crescimento', v: '+' + (((m.meta2026-m.votos2022)/m.votos2022)*100).toFixed(1) + '%', c: '#f59e0b' },
              ].map((x,i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{x.l}</p>
                  <p style={{ color: x.c, fontSize: 24, fontWeight: 800, margin: '4px 0 0' }}>{x.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxVotos = municipios[0]?.votos2022 || 1;
  const lista = [...municipios].sort((a,b) => ordem === 'votos' ? b.votos2022 - a.votos2022 : a.municipio.localeCompare(b.municipio));

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 800, margin: 0 }}>Mapa Eleitoral TSE</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{candidato.nome}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Meta:</span>
          <input type="number" value={meta} onChange={e => setMetaCustom(Number(e.target.value))}
            style={{ width: 100, padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14, fontWeight: 700, textAlign: 'center' }} />
        </div>
      </div>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { l: 'TOTAL 2022', v: candidato.total.toLocaleString('pt-BR'), c: '#0ea5e9' },
            { l: 'META 2026', v: meta.toLocaleString('pt-BR'), c: '#16a34a' },
            { l: 'MUNICIPIOS', v: municipios.length, c: '#10b981' },
          ].map((c,i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>{c.l}</p>
              <p style={{ color: c.c, fontSize: 24, fontWeight: 900, margin: 0 }}>{c.v}</p>
            </div>
          ))}
        </div>
        <div style={{ ...card, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{municipios.length} municipios</span>
          <select value={ordem} onChange={e => setOrdem(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
            <option value="votos">Maior votacao</option>
            <option value="nome">Nome A-Z</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map((m,i) => (
            <div key={m.municipio} onClick={() => setMunicipioSel(m.municipio)}
              style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 14, width: 24 }}>{i+1}</span>
                <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, flex: 1 }}>
                  {m.municipio.charAt(0)+m.municipio.slice(1).toLowerCase()}
                  <span style={{ background: '#dbeafe', color: azul, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{m.perc}%</span>
                </span>
                <span style={{ color: '#1e293b', fontWeight: 700 }}>{m.votos2022.toLocaleString('pt-BR')} vts</span>
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>meta: {m.meta2026.toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, marginLeft: 36 }}>
                <div style={{ height: '100%', width: ((m.votos2022/maxVotos)*100)+'%', background: azul, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
