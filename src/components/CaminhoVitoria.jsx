import { useMemo } from 'react';
import { CANDIDATOS_TSE as candidatos } from '../candidatosTSE';
import { ELEITORADO_MUNICIPIO_2022 } from '../lib/eleitoradoAP';

// Eleitorado REAL (TSE — perfil do eleitor por seção, AP 2022). Fonte única.
const ELEITORADO_MUNICIPIO = ELEITORADO_MUNICIPIO_2022;

const ABSTENCAO_MUNICIPIO = {
  'MACAPÁ': 18.6, 'SANTANA': 16.4, 'LARANJAL DO JARI': 26.4,
  'OIAPOQUE': 22.0, 'MAZAGÃO': 14.3, 'PORTO GRANDE': 25.3,
  'FERREIRA GOMES': 17.2, 'PEDRA BRANCA DO AMAPARI': 25.0,
  'CALÇOENE': 24.3, 'AMAPÁ': 19.0, 'TARTARUGALZINHO': 18.0,
  'CUTIAS': 17.7, 'ITAUBAL': 18.0, 'PRACUÚBA': 20.0,
  'SERRA DO NAVIO': 15.0, 'VITÓRIA DO JARI': 19.0
};

// Lider adversario por municipio (baseado nas imagens do EleitorAI)
const LIDER_ADVERSARIO = {
  'MACAPÁ': { nome: 'INACIO MONTEIRO', votos: '7.0k' },
  'SANTANA': { nome: 'FRANCISCO PAULO', votos: '4.9k' },
  'PEDRA BRANCA DO AMAPARI': { nome: 'PAULO PARANAGUA', votos: '1.8k' },
  'PORTO GRANDE': { nome: 'JACK HOUAT', votos: '1.5k' },
  'FERREIRA GOMES': { nome: 'JAIME DA', votos: '638' },
  'CALÇOENE': { nome: 'LUCIANA ARAUJO', votos: '494' },
  'LARANJAL DO JARI': { nome: 'ALLINY SOUSA', votos: '6.3k' },
  'ITAUBAL': { nome: 'LUCIANA ARAUJO', votos: '417' },
  'MAZAGÃO': { nome: 'ZENEIDE DA', votos: '7.1k' },
  'CUTIAS': { nome: 'AMIRALDO DA', votos: '455' },
  'PRACUÚBA': { nome: 'HILDEGARD DE', votos: '362' },
};

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
  const paulinho = useMemo(() => candidatos.find(c => c.nome && c.nome.includes('PAULO ALCEU')), []);

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

  const card = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px 0' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Voltar
        </button>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 }}>Caminho da Vitoria</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>Onde estao os votos que faltaram — secoes que voce pode virar na proxima eleicao</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Candidato card */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>P</div>
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, margin: 0 }}>Paulo Alceu Avila Ramos</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>DEPUTADO ESTADUAL · MDB · MACAPA/AP · 2022 · 1° turno</p>
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
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>MUNICIPIOS</p>
            <p style={{ color: '#1e293b', fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>{dadosMunicipios.length}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>com voto seu registrado</p>
          </div>
          <div style={{ ...card }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>PENETRACAO MEDIA</p>
            <p style={{ color: '#1e293b', fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>{penGeral.toFixed(1)}%</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>dos eleitores votaram em você</p>
          </div>
          <div style={{ ...card }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>MAIOR RESERVATORIO</p>
            <p style={{ color: '#1e293b', fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>{maiorReserv ? cap(maiorReserv.municipio) : '—'}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{maiorReserv ? (maiorReserv.aptos/1000).toFixed(1) + 'k compareceram' : ''}</p>
          </div>
        </div>

        {/* Lista de municipios */}
        <div style={{ ...card }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>
            OPORTUNIDADES — {dadosMunicipios.length} MUNICIPIOS
          </p>

          {dadosMunicipios.map((m, i) => {
            const lider = LIDER_ADVERSARIO[m.municipio];
            const penCor = m.pen < 1.5 ? '#ef4444' : '#f59e0b';
            const absCor = m.abs > 22 ? '#ef4444' : '#64748b';

            return (
              <div key={m.municipio} style={{ borderBottom: '1px solid #f1f5f9', padding: '14px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13, width: 24, paddingTop: 2 }}>{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>📍</span>
                    <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15 }}>
                      {m.municipio.charAt(0) + m.municipio.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
                    <span style={{ color: '#1e293b', fontWeight: 600 }}>{m.votos} seus</span>
                    <span style={{ color: penCor, fontWeight: 600 }}>{m.pen}% pen.</span>
                    <span style={{ color: absCor }}>{m.abs}% abs.</span>
                    <span style={{ color: '#94a3b8' }}>{(m.aptos/1000).toFixed(1)}k aptos</span>
                  </div>
                  {lider && (
                    <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
                      Lider: <strong style={{ color: '#475569' }}>{lider.nome}</strong> ({lider.votos} vts)
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
