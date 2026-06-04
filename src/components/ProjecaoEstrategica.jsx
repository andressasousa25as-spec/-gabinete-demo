import { useState, useMemo } from 'react';
import { useCandidatoTSE, calcularMetas } from '../hooks/useCandidatoTSE';
import { CANDIDATOS_TSE } from '../candidatosTSE';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

export default function ProjecaoEstrategica({ onVoltar }) {
  const { candidato: auto, loading, nomeBuscado } = useCandidatoTSE();
  const [manual, setManual] = useState(null);
  const [busca, setBusca] = useState('');
  const [metaCustom, setMetaCustom] = useState(null);
  const [crescMacapa, setCrescMacapa] = useState(null);
  const [crescSantana, setCrescSantana] = useState(null);
  const [crescInterior, setCrescInterior] = useState(null);
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

  const votMac = candidato.municipios['MACAPÁ'] || candidato.municipios['MACAPA'] || 0;
  const votSan = candidato.municipios['SANTANA'] || 0;
  const votInt = candidato.total - votMac - votSan;
  const crescPadrao = (((meta - candidato.total) / candidato.total) * 100).toFixed(1);

  const cMac = crescMacapa ?? crescPadrao;
  const cSan = crescSantana ?? crescPadrao;
  const cInt = crescInterior ?? crescPadrao;

  const projMac = Math.round(votMac * (1 + Number(cMac) / 100));
  const projSan = Math.round(votSan * (1 + Number(cSan) / 100));
  const projInt = Math.round(votInt * (1 + Number(cInt) / 100));
  const totalProj = projMac + projSan + projInt;

  const regioes = [
    { nome: 'Macapa', votos: votMac, proj: projMac, setCr: setCrescMacapa, cr: cMac, cor: azul },
    { nome: 'Santana', votos: votSan, proj: projSan, setCr: setCrescSantana, cr: cSan, cor: '#7c3aed' },
    { nome: 'Interior (14 mun.)', votos: votInt, proj: projInt, setCr: setCrescInterior, cr: cInt, cor: '#0891b2' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(12px,4vw,32px)' }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <h1 style={{ color: azul, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Projecao Estrategica 2026</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>{candidato.nome} - Simule cenarios de crescimento</p>

      <div style={{ ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Meta Global</p>
            <input type="number" value={meta} onChange={e => setMetaCustom(Number(e.target.value))}
              style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '2px solid #93c5fd', background: '#eff6ff', fontSize: 18, fontWeight: 800, color: azul, textAlign: 'center' }} />
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 16 }}>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Projecao Total</p>
            <p style={{ color: totalProj >= meta ? '#16a34a' : '#ef4444', fontSize: 24, fontWeight: 800, margin: 0 }}>{totalProj.toLocaleString('pt-BR')}</p>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 16 }}>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Diferenca</p>
            <p style={{ color: totalProj >= meta ? '#16a34a' : '#ef4444', fontSize: 24, fontWeight: 800, margin: 0 }}>
              {totalProj >= meta ? '+' : ''}{(totalProj - meta).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {regioes.map(r => (
            <div key={r.nome} style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{r.nome}</p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>2022: {r.votos.toLocaleString('pt-BR')} ({((r.votos/candidato.total)*100).toFixed(1)}%)</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Crescimento:</span>
                  <input type="number" value={r.cr} onChange={e => r.setCr(e.target.value)}
                    style={{ width: 70, padding: '6px 10px', borderRadius: 8, border: '2px solid '+r.cor+'44', background: r.cor+'11', fontSize: 14, fontWeight: 700, color: r.cor, textAlign: 'center' }} />
                  <span style={{ color: '#64748b', fontSize: 13 }}>%</span>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Projecao 2026</p>
                  <p style={{ color: r.cor, fontSize: 20, fontWeight: 800, margin: 0 }}>{r.proj.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div style={{ marginTop: 10, background: '#e2e8f0', borderRadius: 99, height: 6 }}>
                <div style={{ height: '100%', width: Math.min(100,(r.proj/(meta*0.6))*100)+'%', background: r.cor, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
