import { useMemo } from 'react';
import { CANDIDATOS_TSE as candidatos } from '../candidatosTSE';

const ELEITORADO_ZONA = {
  '1': 14800, '2': 71000, '4': 14200, '5': 19200,
  '6': 83300, '7': 42900, '8': 6800, '10': 58400,
  '11': 14300, '12': 20300,
};
const ABSTENCAO_ZONA = {
  '1': 19.0, '2': 18.6, '4': 22.0, '5': 14.3,
  '6': 16.4, '7': 24.0, '8': 18.0, '10': 18.2,
  '11': 25.0, '12': 22.5,
};
const MUNICIPIOS_ZONA = {
  '1': ['AMAPA','CALCOENE','PRACUUBA'],'2': ['MACAPA'],'4': ['OIAPOQUE'],
  '5': ['MAZAGAO'],'6': ['SANTANA'],'7': ['LARANJAL DO JARI','VITORIA DO JARI'],
  '8': ['TARTARUGALZINHO'],'10': ['MACAPA','CUTIAS','ITAUBAL'],
  '11': ['PEDRA BRANCA DO AMAPARI','SERRA DO NAVIO'],'12': ['PORTO GRANDE','FERREIRA GOMES'],
};

function calcScore(pen, abs) {
  // Oportunidade = baixa penetração (espaço para crescer por persuasão) +
  // abstenção (mobilização). Penetração pesa mais — é o motor real de votos.
  const scorePen = Math.max(0, Math.min(100, (1 - pen / 3) * 100)); // pen 0%→100, ≥3%→0
  const scoreAbs = Math.max(0, Math.min(100, (abs / 30) * 100));     // abs 30%→100
  return Math.round(scorePen * 0.6 + scoreAbs * 0.4);
}

export default function RadarOportunidade({ onVoltar }) {
  const paulinho = useMemo(() => candidatos.find(c => c.nome && c.nome.includes('PAULO ALCEU')), []);

  const dadosZonas = useMemo(() => {
    if (!paulinho) return [];
    const mapa = {};
    for (const s of paulinho.secoes || []) {
      if (!mapa[s.zona]) mapa[s.zona] = { zona: s.zona, votos: 0 };
      mapa[s.zona].votos += s.votos;
    }
    return Object.values(mapa).map(z => {
      const eleitores = ELEITORADO_ZONA[z.zona] || 10000;
      const abs = ABSTENCAO_ZONA[z.zona] || 19;
      const aptos = Math.round(eleitores * (1 - abs / 100));
      const pen = parseFloat(((z.votos / eleitores) * 100).toFixed(1));
      const score = calcScore(pen, abs);
      const classificacao = score >= 70 ? 'Prioridade' : score >= 50 ? 'Atencao' : 'Consolidada';
      const cor = score >= 70 ? '#ef4444' : score >= 50 ? '#f59e0b' : '#10b981';
      const potencial = Math.round(aptos * 0.005);
      return { ...z, eleitores, abs, pen, score, classificacao, cor, potencial, aptos };
    }).sort((a, b) => b.score - a.score);
  }, [paulinho]);

  const prioridade = dadosZonas.filter(z => z.score >= 70).length;
  const atencao = dadosZonas.filter(z => z.score >= 50 && z.score < 70).length;
  const consolidadas = dadosZonas.filter(z => z.score < 50).length;
  const potencialTotal = dadosZonas.reduce((s, z) => s + z.potencial, 0);

  // Insights calculados (não fixos) para a análise estratégica
  const penGeral = (() => {
    const v = dadosZonas.reduce((s, z) => s + z.votos, 0);
    const e = dadosZonas.reduce((s, z) => s + z.eleitores, 0);
    return e ? (v / e) * 100 : 0;
  })();
  const topZona = dadosZonas[0];
  const maiorReserv = [...dadosZonas].sort((a, b) => b.aptos - a.aptos)[0];
  const cap = (s) => s ? s.charAt(0) + s.slice(1).toLowerCase() : s;

  const card = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };
  const maxScore = 100;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 }}>Radar de Oportunidade</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>Zonas com alta abstencao e baixa penetracao — onde estao os votos disponiveis</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Analise estrategica */}
        <div style={{ ...card, marginBottom: 24, border: '1px solid #bfdbfe', background: '#f0f9ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 14 }}>Analise Estrategica</span>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 'auto' }}>Dados TSE 2022</span>
          </div>
          <p style={{ color: '#334155', fontSize: 13, lineHeight: 1.7, margin: '0 0 10px' }}>
            A votação está pulverizada: penetração geral de apenas <strong>{penGeral.toFixed(1)}%</strong> dos eleitores, sinalizando ausência de redutos sólidos. {topZona && (<>A maior oportunidade é a <strong>Zona {topZona.zona}{MUNICIPIOS_ZONA[topZona.zona] ? ' (' + MUNICIPIOS_ZONA[topZona.zona].map(cap).join(', ') + ')' : ''}</strong> — score {topZona.score}, penetração de {topZona.pen}% e abstenção de {topZona.abs}%: espaço para crescer por persuasão.</>)}
          </p>
          {maiorReserv && (
          <div style={{ background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ color: '#92400e', fontSize: 13, margin: 0 }}>
              ⚠️ Por volume, a <strong>Zona {maiorReserv.zona}{MUNICIPIOS_ZONA[maiorReserv.zona] ? ' (' + MUNICIPIOS_ZONA[maiorReserv.zona].map(cap).join(', ') + ')' : ''}</strong> é o maior reservatório: ~{maiorReserv.aptos.toLocaleString('pt-BR')} compareceram e a penetração é de só {maiorReserv.pen}%. Ganhos de penetração aqui rendem o maior número absoluto de votos.
            </p>
          </div>
          )}
        </div>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ ...card, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>PRIORIDADE</p>
            <p style={{ color: '#1e293b', fontSize: 32, fontWeight: 900, margin: '0 0 2px' }}>{prioridade}</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>zonas score ≥ 70</p>
          </div>
          <div style={{ ...card, background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>ATENCAO</p>
            <p style={{ color: '#1e293b', fontSize: 32, fontWeight: 900, margin: '0 0 2px' }}>{atencao}</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>zonas score 50-69</p>
          </div>
          <div style={{ ...card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>CONSOLIDADAS</p>
            <p style={{ color: '#1e293b', fontSize: 32, fontWeight: 900, margin: '0 0 2px' }}>{consolidadas}</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>de {dadosZonas.length} zonas</p>
          </div>
          <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>POTENCIAL (EST.)</p>
            <p style={{ color: '#1d4ed8', fontSize: 32, fontWeight: 900, margin: '0 0 2px' }}>{potencialTotal.toLocaleString('pt-BR')}</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>estimativa: 0,5% do comparecimento</p>
          </div>
        </div>

        {/* Grafico de barras */}
        <div style={{ ...card, marginBottom: 24 }}>
          <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Score de Oportunidade por Zona</p>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 20px' }}>Vermelho = prioridade maxima · Amarelo = atencao · Verde = consolidado</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {dadosZonas.map(z => (
              <div key={z.zona} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 6, height: 100, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: `${z.score}%`, background: z.cor, borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
                </div>
                <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700 }}>Z{z.zona}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[{ cor: '#ef4444', label: 'Score ≥ 70 (Prioridade)' }, { cor: '#f59e0b', label: '50-69 (Atencao)' }, { cor: '#10b981', label: '< 50 (Consolidado)' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.cor }} />
                <span style={{ color: '#64748b', fontSize: 12 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zonas por regiao */}
        <div style={{ ...card }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>ZONAS POR SCORE DE OPORTUNIDADE</p>
          {dadosZonas.map(z => (
            <div key={z.zona} style={{ borderBottom: '1px solid #f1f5f9', padding: '14px 0', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: z.score >= 70 ? '#fef2f2' : z.score >= 50 ? '#fffbeb' : '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px solid ${z.cor}` }}>
                <span style={{ color: z.cor, fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{z.score}</span>
                <span style={{ color: z.cor, fontSize: 9, fontWeight: 700 }}>SCORE</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15 }}>Zona {z.zona}</span>
                  <span style={{ background: z.score >= 70 ? '#fef2f2' : z.score >= 50 ? '#fffbeb' : '#f0fdf4', color: z.cor, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{z.classificacao}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>Pen: <strong style={{ color: z.pen < 1.5 ? '#ef4444' : '#1e293b' }}>{z.pen}%</strong></span>
                  <span style={{ color: '#64748b' }}>Abs: <strong style={{ color: z.abs > 22 ? '#ef4444' : '#1e293b' }}>{z.abs}%</strong></span>
                  <span style={{ color: '#64748b' }}>Votos: <strong style={{ color: '#1e293b' }}>{z.votos}</strong></span>
                  <span style={{ color: '#64748b' }}>Potencial: <strong style={{ color: '#2563eb' }}>+{z.potencial.toLocaleString('pt-BR')}</strong></span>
                </div>
                {MUNICIPIOS_ZONA[z.zona] && (
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>
                    {MUNICIPIOS_ZONA[z.zona].map(m => m.charAt(0) + m.slice(1).toLowerCase()).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
