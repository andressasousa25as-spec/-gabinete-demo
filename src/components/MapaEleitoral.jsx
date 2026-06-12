import { useState, useMemo } from 'react';
import { CANDIDATOS_TSE as candidatos } from '../candidatosTSE';

const PERFIL_MUNICIPIO = {
  'MACAPÁ': 'Capital do Amapa, maior eleitorado do estado com cerca de 310 mil eleitores aptos. Economia baseada em servicos publicos e comercio. Concentra 71% dos votos do candidato e e o principal territorio eleitoral.',
  'SANTANA': 'Segundo maior municipio do Amapa, com cerca de 83 mil eleitores aptos. Polo industrial e comercial, proxima a Macapa. Representa 12% da votacao total.',
  'LARANJAL DO JARI': 'Municipio do sul do Amapa com alta absten cao historica (26%). Territorio de alto potencial inexplorado com cerca de 29 mil aptos.',
  'PEDRA BRANCA DO AMAPARI': 'Municipio do interior com forte influencia da mineracao. Alta absten cao (25%) indica potencial de crescimento.',
  'PORTO GRANDE': 'Municipio do sul com alta absten cao (25%). Economia agricola e agroindustrial.',
  'FERREIRA GOMES': 'Municipio com usina hidreletrica. Eleitorado pequeno mas concentrado.',
  'MAZAGÃO': 'Um dos mais antigos municipios do Amapa. Eleitorado disperso geograficamente.',
  'CALÇOENE': 'Municipio do norte do Amapa proximo ao Oiapoque. Alta absten cao (24%).',
  'LARANJAL DO JARI': 'Grande municipio do sul com alta absten cao. Alto potencial de votos.',
  'OIAPOQUE': 'Municipio fronteirico com a Guiana Francesa. Alta absten cao (22%).',
  'AMAPÁ': 'Municipio historico do norte do estado. Eleitorado pequeno.',
  'TARTARUGALZINHO': 'Municipio do norte com economia agropecuaria.',
  'CUTIAS': 'Municipio pequeno do interior.',
  'ITAUBAL': 'Municipio pequeno do interior.',
  'PRACUÚBA': 'Municipio com menor eleitorado do estado.',
  'SERRA DO NAVIO': 'Municipio historico da mineracao de manganes.',
  'VITÓRIA DO JARI': 'Municipio do sul do Amapa.',
};

export default function MapaEleitoral({ onVoltar }) {
  const [busca, setBusca] = useState('');
  const [municipioSel, setMunicipioSel] = useState(null);
  const [ordenacao, setOrdenacao] = useState('votos');

  const paulinho = useMemo(() => candidatos.find(c => c.nome && c.nome.includes('PAULO ALCEU')), []);

  const dadosMunicipios = useMemo(() => {
    if (!paulinho) return [];
    const mapa = {};
    for (const s of paulinho.secoes || []) {
      if (!mapa[s.municipio]) mapa[s.municipio] = { municipio: s.municipio, votos: 0, zonas: new Set(), secoes: [] };
      mapa[s.municipio].votos += s.votos;
      mapa[s.municipio].zonas.add(s.zona);
      mapa[s.municipio].secoes.push(s);
    }
    return Object.values(mapa)
      .map(m => ({ ...m, zonas: m.zonas.size, nZonas: [...new Set(m.secoes.map(s => s.zona))] }))
      .sort((a, b) => b.votos - a.votos);
  }, [paulinho]);

  const totalVotos = dadosMunicipios.reduce((s, m) => s + m.votos, 0);
  const maxVotos = dadosMunicipios[0]?.votos || 1;

  const municipiosFiltrados = dadosMunicipios
    .filter(m => m.municipio.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => ordenacao === 'votos' ? b.votos - a.votos : a.municipio.localeCompare(b.municipio));

  const card = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };

  // Drill-down: detalhe do municipio
  if (municipioSel) {
    const m = dadosMunicipios.find(x => x.municipio === municipioSel);
    const zonasDados = {};
    for (const s of m.secoes) {
      if (!zonasDados[s.zona]) zonasDados[s.zona] = { zona: s.zona, votos: 0, secoes: 0 };
      zonasDados[s.zona].votos += s.votos;
      zonasDados[s.zona].secoes++;
    }
    const zonasList = Object.values(zonasDados).sort((a, b) => b.votos - a.votos);
    const maxZona = zonasList[0]?.votos || 1;

    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px' }}>
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setMunicipioSel(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            Municipios
          </button>
          <span style={{ color: '#64748b' }}>/</span>
          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>📍 {municipioSel} — AP</span>
          <span style={{ color: '#64748b', marginLeft: 'auto' }}>{m.zonas} zonas &nbsp; {m.votos.toLocaleString('pt-BR')} votos</span>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Perfil Socioeconomico */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: 16, margin: 0 }}>Perfil Socioeconomico</h3>
              <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Dados TSE 2022</span>
            </div>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              {PERFIL_MUNICIPIO[municipioSel] || `${municipioSel} e um municipio do estado do Amapa. Os dados eleitorais de 2022 mostram ${m.votos} votos para o candidato Paulo Alceu Avila Ramos em ${m.zonas} zona(s) eleitoral(is).`}
            </p>
          </div>

          {/* Zonas */}
          <div style={{ ...card }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>ZONAS ELEITORAIS — {zonasList.length} zona(s)</p>
            {zonasList.map(z => (
              <div key={z.zona} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: '#2563eb', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>
                      Zona {z.zona}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{z.secoes} secoes</span>
                  </div>
                  <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15 }}>{z.votos.toLocaleString('pt-BR')} vts</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6 }}>
                  <div style={{ height: '100%', width: `${(z.votos / maxZona) * 100}%`, background: '#2563eb', borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 40px' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 }}>Mapa Eleitoral</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>Visao micro do territorio — municipios, zonas, secoes e perfil socioeconomico</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'TOTAL DE VOTOS', val: totalVotos.toLocaleString('pt-BR'), cor: '#0ea5e9' },
            { label: 'MUNICIPIOS', val: dadosMunicipios.length, sub: `${[...new Set(dadosMunicipios.flatMap(m => m.nZonas))].length} zonas`, cor: '#10b981' },
            { label: 'ZONAS', val: [...new Set(dadosMunicipios.flatMap(m => m.nZonas))].length, cor: '#8b5cf6' },
            { label: 'MAIOR VOTACAO', val: dadosMunicipios[0]?.municipio.charAt(0) + dadosMunicipios[0]?.municipio.slice(1).toLowerCase(), sub: `${dadosMunicipios[0]?.votos.toLocaleString('pt-BR')} votos`, cor: '#f59e0b', grande: true },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>{c.label}</p>
              <p style={{ color: c.grande ? '#1e293b' : c.cor, fontSize: c.grande ? 20 : 28, fontWeight: 900, margin: '0 0 2px' }}>{c.val}</p>
              {c.sub && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filtro */}
        <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>{dadosMunicipios.length} MUNICIPIOS</span>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar..."
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: 200, outline: 'none' }} />
          </div>
          <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff' }}>
            <option value="votos">Maior votacao</option>
            <option value="nome">Nome A-Z</option>
          </select>
        </div>

        {/* Lista de municipios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {municipiosFiltrados.map((m, i) => {
            const perc = (m.votos / maxVotos) * 100;
            return (
              <div key={m.municipio} onClick={() => setMunicipioSel(m.municipio)}
                style={{ ...card, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.15)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.07)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 14, width: 24 }}>{i + 1}</span>
                  <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, flex: 1 }}>
                    {m.municipio.charAt(0) + m.municipio.slice(1).toLowerCase()}
                    <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>AP</span>
                    {m.zonas > 1
                      ? <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{m.zonas} zonas</span>
                      : <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>Z{m.nZonas[0]}</span>
                    }
                  </span>
                  <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15 }}>{m.votos.toLocaleString('pt-BR')} vts</span>
                  <span style={{ color: '#94a3b8', fontSize: 16 }}>›</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, marginLeft: 36 }}>
                  <div style={{ height: '100%', width: `${perc}%`, background: '#2563eb', borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
