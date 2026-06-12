import { useMemo } from 'react';
import { CANDIDATOS_TSE as candidatos } from '../candidatosTSE';

const MESORREGIAO = {
  'Sul do Amapa': ['MACAPÁ','SANTANA','MAZAGÃO','PORTO GRANDE','ITAUBAL','CUTIAS','PEDRA BRANCA DO AMAPARI','FERREIRA GOMES','SERRA DO NAVIO'],
  'Norte do Amapa': ['AMAPÁ','CALÇOENE','OIAPOQUE','LARANJAL DO JARI','VITÓRIA DO JARI','PRACUÚBA','TARTARUGALZINHO']
};

const MICRORREGIAO = {
  'Macapa': ['MACAPÁ','SANTANA','MAZAGÃO','ITAUBAL','CUTIAS'],
  'Serrana': ['PEDRA BRANCA DO AMAPARI','FERREIRA GOMES','SERRA DO NAVIO','PORTO GRANDE'],
  'Oiapoque': ['OIAPOQUE','CALÇOENE','AMAPÁ','PRACUÚBA','TARTARUGALZINHO'],
  'Laranjal do Jari': ['LARANJAL DO JARI','VITÓRIA DO JARI'],
};

export default function AnaliseTerritorial({ onVoltar }) {
  const paulinho = useMemo(() => candidatos.find(c => c.nome && c.nome.includes('PAULO ALCEU')), []);

  const dados = useMemo(() => {
    if (!paulinho) return { total: 0, meso: {}, micro: {} };
    const meso = {};
    const micro = {};
    let total = 0;
    for (const s of paulinho.secoes || []) {
      total += s.votos;
      for (const [reg, lista] of Object.entries(MESORREGIAO)) {
        if (lista.includes(s.municipio)) { meso[reg] = (meso[reg] || 0) + s.votos; }
      }
      for (const [reg, lista] of Object.entries(MICRORREGIAO)) {
        if (lista.includes(s.municipio)) { micro[reg] = (micro[reg] || 0) + s.votos; }
      }
    }
    return { total, meso, micro };
  }, [paulinho]);

  const card = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };
  const mesoList = Object.entries(dados.meso).sort((a, b) => b[1] - a[1]);
  const microList = Object.entries(dados.micro).sort((a, b) => b[1] - a[1]);
  const maxMeso = mesoList[0]?.[1] || 1;
  const maxMicro = microList[0]?.[1] || 1;

  const CORES_MESO = { 'Sul do Amapa': '#2563eb', 'Norte do Amapa': '#10b981' };
  const CORES_MICRO = ['#2563eb', '#7c3aed', '#f59e0b', '#ef4444'];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 }}>Analise Territorial</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>Distribuicao de votos por Mesorregiao → Microrregiao → Municipio</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'TOTAL DE VOTOS', val: dados.total.toLocaleString('pt-BR'), cor: '#0ea5e9' },
            { label: 'MUNICIPIOS', val: '16', sub: '2 mesorregioes', cor: '#10b981' },
            { label: 'ELEICAO', val: '2022', sub: 'GERAL · 1° turno', cor: '#8b5cf6' },
            { label: 'CARGO', val: 'DEP. ESTAD...', sub: 'MDB · MACAPA/AP', cor: '#f59e0b' },
          ].map((c, i) => (
            <div key={i} style={{ ...card }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>{c.label}</p>
              <p style={{ color: c.cor, fontSize: 26, fontWeight: 900, margin: '0 0 2px' }}>{c.val}</p>
              {c.sub && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{c.sub}</p>}
            </div>
          ))}
        </div>

        <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: '0 0 16px' }}>MESORREGIAO → MICRORREGIAO → MUNICIPIO</p>

        {/* Mesorregioes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {mesoList.map(([reg, votos], i) => {
            const perc = ((votos / dados.total) * 100).toFixed(1);
            const cor = CORES_MESO[reg] || '#2563eb';
            // Micros desta meso
            const municipiosDaMeso = MESORREGIAO[reg] || [];
            const microsDestaMeso = microList.filter(([m]) => {
              const muns = MICRORREGIAO[m] || [];
              return muns.some(mu => municipiosDaMeso.includes(mu));
            });

            return (
              <div key={reg} style={{ ...card }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ color: '#1e293b', fontWeight: 800, fontSize: 16, flex: 1 }}>{i + 1} {reg}</span>
                  <span style={{ color: '#1e293b', fontWeight: 700 }}>{(votos / 1000).toFixed(1)}k</span>
                  <span style={{ color: '#64748b', fontSize: 14 }}>{perc}%</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 8, marginBottom: 16 }}>
                  <div style={{ height: '100%', width: `${perc}%`, background: cor, borderRadius: 99 }} />
                </div>
                {/* Micros */}
                {microsDestaMeso.map(([micro, mv], j) => {
                  const mp = ((mv / dados.total) * 100).toFixed(1);
                  return (
                    <div key={micro} style={{ paddingLeft: 16, marginBottom: 10, borderLeft: `3px solid ${cor}20` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>{micro}</span>
                        <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 13 }}>{mv.toLocaleString('pt-BR')} vts &nbsp; <span style={{ color: '#64748b', fontWeight: 400 }}>{mp}%</span></span>
                      </div>
                      <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5 }}>
                        <div style={{ height: '100%', width: `${(mv / maxMeso) * 100}%`, background: CORES_MICRO[j % 4], borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
