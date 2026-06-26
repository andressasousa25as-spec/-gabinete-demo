import { useMemo } from 'react';
import { useCandidatoAnalise } from '../lib/useCandidatoAnalise';
import { ELEITORADO_ZONA_2022, ABSTENCAO_ZONA_2022 } from '../lib/eleitoradoAP';

// Eleitorado e abstenção REAIS por zona (TSE, AP 2022). Fonte única.
const ELEITORADO_ZONA = ELEITORADO_ZONA_2022;
const ABSTENCAO_ZONA = ABSTENCAO_ZONA_2022;
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
  const { candidato: paulinho, loading, semDados } = useCandidatoAnalise();

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

  const card = { background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };
  const maxScore = 100;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando análise…</div>
  );
  if (semDados) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 32px' }}>
      <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>Voltar</button>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, border: '1px solid var(--border)', maxWidth: 560 }}>
        <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>Análise eleitoral indisponível</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>Este candidato não tem histórico de votação no TSE (ou ainda não foi importado). O restante do sistema — cadastro, mapa e comunicação — funciona normalmente.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 40px' }}>
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--surface)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, margin: 0 }}>Radar de Oportunidade</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>Zonas com alta abstencao e baixa penetracao — onde estao os votos disponiveis</p>
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
          <p style={{ color: '#1e293b', fontSize: 13, lineHeight: 1.7, margin: '0 0 10px' }}>
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
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Score de Oportunidade por Zona</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 20px' }}>Vermelho = prioridade maxima · Amarelo = atencao · Verde = consolidado</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {dadosZonas.map(z => (
              <div key={z.zona} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 6, height: 100, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: `${z.score}%`, background: z.cor, borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>Z{z.zona}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[{ cor: '#ef4444', label: 'Score ≥ 70 (Prioridade)' }, { cor: '#f59e0b', label: '50-69 (Atencao)' }, { cor: '#10b981', label: '< 50 (Consolidado)' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.cor }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zonas por regiao */}
        <div style={{ ...card }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>ZONAS POR SCORE DE OPORTUNIDADE</p>
          {dadosZonas.map(z => (
            <div key={z.zona} style={{ borderBottom: '1px solid var(--border)', padding: '14px 0', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: z.score >= 70 ? '#fef2f2' : z.score >= 50 ? '#fffbeb' : '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px solid ${z.cor}` }}>
                <span style={{ color: z.cor, fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{z.score}</span>
                <span style={{ color: z.cor, fontSize: 9, fontWeight: 700 }}>SCORE</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>Zona {z.zona}</span>
                  <span style={{ background: z.score >= 70 ? '#fef2f2' : z.score >= 50 ? '#fffbeb' : '#f0fdf4', color: z.cor, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{z.classificacao}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pen: <strong style={{ color: z.pen < 1.5 ? '#ef4444' : 'var(--text)' }}>{z.pen}%</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>Abs: <strong style={{ color: z.abs > 22 ? '#ef4444' : 'var(--text)' }}>{z.abs}%</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>Votos: <strong style={{ color: 'var(--text)' }}>{z.votos}</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>Potencial: <strong style={{ color: '#2563eb' }}>+{z.potencial.toLocaleString('pt-BR')}</strong></span>
                </div>
                {MUNICIPIOS_ZONA[z.zona] && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>
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
