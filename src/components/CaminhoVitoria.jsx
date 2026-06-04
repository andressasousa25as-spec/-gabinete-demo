import { useState, useMemo } from 'react';
import { useCandidatoTSE, calcularMetas } from '../hooks/useCandidatoTSE';
import { CANDIDATOS_TSE } from '../candidatosTSE';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

export default function CaminhoVitoria({ onVoltar }) {
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

  const top3 = municipios.slice(0, 3);
  const cresc = (((meta - candidato.total) / candidato.total) * 100).toFixed(1);
  const corStatus = { CRITICO: '#ef4444', ALTO: '#f97316', MEDIO: '#eab308' };
  const etapas = [
    { n: 1, t: 'Consolidar base principal', d: top3[0]?.municipio.charAt(0)+top3[0]?.municipio.slice(1).toLowerCase() + ' representa ' + top3[0]?.perc + '% dos votos. Presenca constante e essencial.', s: 'CRITICO', icon: 'domicilio' },
    { n: 2, t: 'Expandir municipios medios', d: (top3[1]?.municipio.charAt(0)+top3[1]?.municipio.slice(1).toLowerCase()) + ' e ' + (top3[2]?.municipio.charAt(0)+top3[2]?.municipio.slice(1).toLowerCase()) + ' somam ' + (Number(top3[1]?.perc||0)+Number(top3[2]?.perc||0)).toFixed(1) + '%. Aumente penetracao.', s: 'ALTO', icon: 'crescimento' },
    { n: 3, t: 'Conquistar municipios inexplorados', d: 'Municipios com menos de 2% de penetracao tem alto potencial de crescimento.', s: 'MEDIO', icon: 'alvo' },
    { n: 4, t: 'Redes sociais e digital', d: 'Alcance eleitores jovens com conteudo direcionado por bairro e municipio.', s: 'MEDIO', icon: 'celular' },
    { n: 5, t: 'Ativar rede de liderancas', d: 'Cada lideranca mobiliza 20-50 eleitores. Fortaleça a capilaridade.', s: 'ALTO', icon: 'rede' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(12px,4vw,32px)' }}>
      <button onClick={onVoltar} style={{ marginBottom: 20, padding: '10px 20px', background: azul, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      <h1 style={{ color: azul, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Caminho da Vitoria</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>{candidato.nome} - Estrategia para {meta.toLocaleString('pt-BR')} votos</p>

      <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <p style={{ color: '#1e40af', fontSize: 14, margin: 0 }}>
          Top 3 municipios representam <strong>{(top3.reduce((s,m) => s+m.votos2022,0)/candidato.total*100).toFixed(1)}%</strong> dos votos.
          Crescimento necessario: <strong>{cresc}%</strong>
        </p>
      </div>

      <div style={{ ...card }}>
        <h3 style={{ color: azul, marginBottom: 16 }}>Etapas do Plano</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {etapas.map(e => (
            <div key={e.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: (corStatus[e.s]||'#64748b')+'22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: corStatus[e.s]||'#64748b', flexShrink: 0, fontSize: 16 }}>{e.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{e.t}</p>
                  <span style={{ background: (corStatus[e.s]||'#64748b')+'22', color: corStatus[e.s]||'#64748b', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{e.s}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{e.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
