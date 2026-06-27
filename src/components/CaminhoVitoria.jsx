import { useMemo } from 'react';
import { useCandidatoAnalise } from '../lib/useCandidatoAnalise';
import { ELEITORADO_MUNICIPIO_2022, ABSTENCAO_MUNICIPIO_2022 } from '../lib/eleitoradoAP';
import { CANDIDATOS_TSE } from '../candidatosTSE';

// Eleitorado e abstenção REAIS (TSE, AP 2022). Fonte única.
const ELEITORADO_MUNICIPIO = ELEITORADO_MUNICIPIO_2022;
const ABSTENCAO_MUNICIPIO = ABSTENCAO_MUNICIPIO_2022;

// Maior votado (dep. estadual 2022) em cada município — calculado da base TSE.
function liderMunicipio(mun) {
  let best = null;
  for (const c of CANDIDATOS_TSE) {
    if (!(c.cargo || '').includes('DEPUTADO ESTADUAL')) continue;
    const v = c.municipios?.[mun] || 0;
    if (v > 0 && (!best || v > best.votos)) best = { nome: c.nome, votos: v };
  }
  return best;
}

function getBadge(tipo) {
  const cores = {
    'Alto potencial': { bg: '#dbeafe', cor: '#1d4ed8' },
    'Alta abstencao': { bg: '#fef3c7', cor: '#d97706' },
    'Oportunidade': { bg: '#d1fae5', cor: '#065f46' },
  };
  const c = cores[tipo] || { bg: '#f1f5f9', cor: '#475569' };
  return (
    <span style={{ background: c.bg, color: c.cor, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {tipo}
    </span>
  );
}

export default function CaminhoVitoria({ onVoltar }) {
  const { candidato: paulinho, loading, semDados } = useCandidatoAnalise();

  const dadosMunicipios = useMemo(() => {
    if (!paulinho) return [];
    const mapa = {};
    for (const s of paulinho.secoes || []) {
      if (!mapa[s.municipio]) mapa[s.municipio] = { municipio: s.municipio, votos: 0 };
      mapa[s.municipio].votos += s.votos;
    }
    return Object.values(mapa).map(m => {
      const eleitores = ELEITORADO_MUNICIPIO[m.municipio] || 5000;
      const abs = ABSTENCAO_MUNICIPIO[m.municipio] || 19;
      const pen = ((m.votos / eleitores) * 100).toFixed(1);
      const aptos = Math.round(eleitores * (1 - abs / 100));
      const conquistavel = Math.round(aptos * 0.005);
      const tipo = abs > 22 ? 'Alta abstencao' : 'Alto potencial';
      return { ...m, eleitores, abs, pen: parseFloat(pen), aptos, conquistavel, tipo };
    }).sort((a, b) => b.votos - a.votos);
  }, [paulinho]);

  const totalConquistavel = dadosMunicipios.reduce((s, m) => s + m.conquistavel, 0);
  const penGeral = (() => {
    const v = dadosMunicipios.reduce((s, m) => s + m.votos, 0);
    const e = dadosMunicipios.reduce((s, m) => s + m.eleitores, 0);
    return e ? (v / e) * 100 : 0;
  })();
  const maiorReserv = [...dadosMunicipios].sort((a, b) => b.aptos - a.aptos)[0];
  const cap = (s) => s ? s.charAt(0) + s.slice(1).toLowerCase() : s;

  const card = { background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 40px 0' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--surface)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Voltar
        </button>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, margin: 0 }}>Caminho da Vitoria</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>Onde estao os votos que faltaram — secoes que voce pode virar na proxima eleicao</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Candidato card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>P</div>
          <div>
            <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: 0 }}>{paulinho?.nome}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 0' }}>{paulinho?.cargo} · {paulinho?.partido || '—'} · MACAPA/AP · {paulinho?.ano} · 1° turno</p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>POTENCIAL TOTAL</p>
            <p style={{ color: '#1d4ed8', fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>+{(totalConquistavel/1000).toFixed(1)}k</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>estimativa: 0,5% do comparecimento</p>
          </div>
          <div style={{ ...card }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>MUNICIPIOS</p>
            <p style={{ color: 'var(--text)', fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>{dadosMunicipios.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>com voto seu registrado</p>
          </div>
          <div style={{ ...card }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>PENETRACAO MEDIA</p>
            <p style={{ color: 'var(--text)', fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>{penGeral.toFixed(1)}%</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>dos eleitores votaram em você</p>
          </div>
          <div style={{ ...card }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>MAIOR RESERVATORIO</p>
            <p style={{ color: 'var(--text)', fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>{maiorReserv ? cap(maiorReserv.municipio) : '—'}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{maiorReserv ? (maiorReserv.aptos/1000).toFixed(1) + 'k compareceram' : ''}</p>
          </div>
        </div>

        {/* Lista de municipios */}
        <div style={{ ...card }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>
            OPORTUNIDADES — {dadosMunicipios.length} MUNICIPIOS
          </p>

          {dadosMunicipios.map((m, i) => {
            const lider = liderMunicipio(m.municipio);
            const penCor = m.pen < 1.5 ? '#ef4444' : '#f59e0b';
            const absCor = m.abs > 22 ? '#ef4444' : 'var(--text-muted)';

            return (
              <div key={m.municipio} style={{ borderBottom: '1px solid var(--border)', padding: '14px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, width: 24, paddingTop: 2 }}>{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>📍</span>
                    <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>
                      {m.municipio.charAt(0) + m.municipio.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{m.votos} seus</span>
                    <span style={{ color: penCor, fontWeight: 600 }}>{m.pen}% pen.</span>
                    <span style={{ color: absCor }}>{m.abs}% abs.</span>
                    <span style={{ color: 'var(--text-muted)' }}>{(m.aptos/1000).toFixed(1)}k aptos</span>
                  </div>
                  {lider && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>
                      Mais votado aqui: <strong style={{ color: 'var(--text-muted)' }}>{lider.nome}</strong> ({lider.votos.toLocaleString('pt-BR')} vts)
                    </p>
                  )}
                </div>
                <div>{getBadge(m.tipo)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
