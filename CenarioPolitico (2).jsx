import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const VOTOS_2022_TOTAL = 4880;
const META_GLOBAL_INICIAL = 7000;

const municipiosBase = [
  { municipio: 'Macapa',                  votos2022: 3474 },
  { municipio: 'Santana',                 votos2022: 581  },
  { municipio: 'Pedra Branca do Amapari', votos2022: 185  },
  { municipio: 'Porto Grande',            votos2022: 121  },
  { municipio: 'Ferreira Gomes',          votos2022: 117  },
  { municipio: 'Calcoe ne',               votos2022: 61   },
  { municipio: 'Laranjal do Jari',        votos2022: 59   },
  { municipio: 'Itaubal',                 votos2022: 58   },
  { municipio: 'Mazagao',                 votos2022: 54   },
  { municipio: 'Cutias',                  votos2022: 54   },
  { municipio: 'Pracuuba',               votos2022: 44   },
  { municipio: 'Oiapoque',               votos2022: 27   },
  { municipio: 'Tartarugalzinho',         votos2022: 20   },
  { municipio: 'Amapa',                   votos2022: 13   },
  { municipio: 'Serra do Navio',          votos2022: 11   },
  { municipio: 'Vitoria do Jari',         votos2022: 1    },
];

const bairrosBase = [
  { bairro: 'Central',           votos2022: 517 },
  { bairro: 'Trem',              votos2022: 237 },
  { bairro: 'Novo Horizonte',    votos2022: 232 },
  { bairro: 'Pacoval',           votos2022: 216 },
  { bairro: 'Zerao',             votos2022: 211 },
  { bairro: 'Buritizal',         votos2022: 159 },
  { bairro: 'Beirol',            votos2022: 123 },
  { bairro: 'Santa Ines',        votos2022: 118 },
  { bairro: 'Muca',              votos2022: 114 },
  { bairro: 'Nova Esperanca',    votos2022: 111 },
  { bairro: 'Congos',            votos2022: 110 },
  { bairro: 'Marabaixo',         votos2022: 91  },
  { bairro: 'Perpetuo Socorro',  votos2022: 86  },
  { bairro: 'Infraero',          votos2022: 85  },
  { bairro: 'Jd. Felicidade II', votos2022: 78  },
  { bairro: 'Laguinho',          votos2022: 70  },
  { bairro: 'Santa Rita',        votos2022: 69  },
  { bairro: 'Jesus de Nazare',   votos2022: 69  },
  { bairro: 'Jd. Felicidade 1',  votos2022: 66  },
  { bairro: 'Brasil Novo',       votos2022: 58  },
  { bairro: 'Treme',             votos2022: 43  },
  { bairro: 'Macapaba',          votos2022: 37  },
  { bairro: 'Cabralzinho',       votos2022: 33  },
  { bairro: 'Bone Azul',         votos2022: 32  },
  { bairro: 'Fazendinha',        votos2022: 32  },
  { bairro: 'Infraero 2',        votos2022: 30  },
  { bairro: 'Bairro Pantanal',   votos2022: 22  },
  { bairro: 'Demais bairros',    votos2022: 16  },
];

function calcMetas(base, coef, campo) {
  return base.map(item => ({ ...item, meta2026: Math.round(item[campo] * coef) }));
}

function prioridade(meta) {
  if (meta >= 700) return { label: 'CRITICO', cor: '#ef4444' };
  if (meta >= 300) return { label: 'ALTO',    cor: '#f97316' };
  if (meta >= 100) return { label: 'MEDIO',   cor: '#eab308' };
  return               { label: 'BAIXO',   cor: '#22c55e' };
}

const card = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
const tdStyle = { padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#1e293b' };
const inputMeta = { width: 80, padding: '5px 8px', border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', fontSize: 13, color: '#1d4ed8', textAlign: 'center', fontWeight: 700 };
const azul = '#1d4ed8';

export default function CenarioPolitico({ onVoltar }) {
  const [abaAtiva, setAbaAtiva] = useState('municipios');
  const [metaGlobal, setMetaGlobal] = useState(META_GLOBAL_INICIAL);
  const [nomeCandidato, setNomeCandidato] = useState('Candidato Demo');
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeTemp, setNomeTemp] = useState('Candidato Demo');
  const [votosBase, setVotosBase] = useState(VOTOS_2022_TOTAL);
  const [editandoVotos, setEditandoVotos] = useState(false);
  const [votosTemp, setVotosTemp] = useState(VOTOS_2022_TOTAL);

  const coef = metaGlobal / votosBase;

  const [municipios, setMunicipios] = useState(() => calcMetas(municipiosBase, coef, 'votos2022'));
  const [bairros, setBairros] = useState(() => calcMetas(bairrosBase, coef, 'votos2022'));

  function aplicarMetaGlobal(novaMetaGlobal) {
    const novoCoef = novaMetaGlobal / votosBase;
    setMetaGlobal(novaMetaGlobal);
    setMunicipios(calcMetas(municipiosBase, novoCoef, 'votos2022'));
    setBairros(calcMetas(bairrosBase, novoCoef, 'votos2022'));
  }

  function aplicarVotosBase(novosVotos) {
    const novoCoef = metaGlobal / novosVotos;
    setVotosBase(novosVotos);
    setMunicipios(calcMetas(municipiosBase, novoCoef, 'votos2022'));
    setBairros(calcMetas(bairrosBase, novoCoef, 'votos2022'));
  }

  const totalMeta = municipios.reduce((s, m) => s + m.meta2026, 0);
  const totalMeta2022 = bairrosBase.reduce((s, b) => s + b.votos2022, 0);
  const metaMacapa = municipios.find(m => m.municipio === 'Macapa')?.meta2026 ?? 0;
  const totalMetaBairros = bairros.reduce((s, b) => s + b.meta2026, 0);

  const chartMun = [...municipios].sort((a,b) => b.meta2026 - a.meta2026).slice(0,8)
    .map(m => ({ name: m.municipio.length > 12 ? m.municipio.slice(0,12)+'...' : m.municipio, '2022': m.votos2022, 'Meta 2026': m.meta2026 }));

  const pizzaColors = ['#1d4ed8','#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#dbeafe'];
  const chartPizza = [...municipios].sort((a,b) => b.meta2026 - a.meta2026).map(m => ({ name: m.municipio, value: m.meta2026 }));

  const chartBairros = [...bairros].sort((a,b) => b.meta2026 - a.meta2026).slice(0,10)
    .map(b => ({ name: b.bairro.length > 14 ? b.bairro.slice(0,14)+'...' : b.bairro, '2022': b.votos2022, 'Meta 2026': b.meta2026 }));

  return (
    <div style={{ padding: '0 0 40px', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {onVoltar && (
          <button onClick={onVoltar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>←</button>
        )}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cenario Politico</h2>
          {/* Nome editavel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {editandoNome ? (
              <>
                <input value={nomeTemp} onChange={e => setNomeTemp(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: 14, color: '#1d4ed8', fontWeight: 700 }} />
                <button onClick={() => { setNomeCandidato(nomeTemp); setEditandoNome(false); }}
                  style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>OK</button>
                <button onClick={() => setEditandoNome(false)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>X</button>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', cursor: 'pointer' }} onClick={() => { setNomeTemp(nomeCandidato); setEditandoNome(true); }}>
                Metas eleitorais 2026 — <strong style={{ color: '#1d4ed8' }}>{nomeCandidato}</strong> <span style={{ fontSize: 11 }}>✏️ editar nome</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 24 }}>
        {/* Votos base editavel */}
        <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Votos Base (editavel)</div>
          {editandoVotos ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input type="number" value={votosTemp} onChange={e => setVotosTemp(parseInt(e.target.value) || 0)}
                style={{ width: '100%', fontSize: 18, fontWeight: 700, color: '#64748b', border: '1px solid #93c5fd', borderRadius: 6, padding: '2px 6px' }} />
              <button onClick={() => { aplicarVotosBase(votosTemp); setEditandoVotos(false); }}
                style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 13 }}>OK</button>
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b', cursor: 'pointer' }} onClick={() => { setVotosTemp(votosBase); setEditandoVotos(true); }}>
              {votosBase.toLocaleString('pt-BR')} <span style={{ fontSize: 11, color: '#94a3b8' }}>✏️</span>
            </div>
          )}
        </div>

        {[
          { label: 'Coeficiente', valor: coef.toFixed(4) + 'x', cor: '#7c3aed' },
          { label: 'Crescimento', valor: '+' + (((metaGlobal - votosBase) / votosBase) * 100).toFixed(1) + '%', cor: '#059669' },
        ].map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.cor }}>{c.valor}</div>
          </div>
        ))}

        {/* Meta global editavel */}
        <div style={{ background: '#eff6ff', borderRadius: 12, border: '1.5px solid #93c5fd', padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Meta Global 2026</div>
          <input type="number" value={metaGlobal} onChange={e => aplicarMetaGlobal(parseInt(e.target.value) || 0)}
            style={{ width: '100%', fontSize: 22, fontWeight: 700, color: azul, background: 'transparent', border: 'none', outline: 'none', padding: 0 }} />
          <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>Edite para recalcular tudo</div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'municipios', label: 'Municipios' },
          { key: 'bairros',    label: 'Bairros Macapa' },
          { key: 'graficos',   label: 'Graficos' },
        ].map(a => (
          <button key={a.key} onClick={() => setAbaAtiva(a.key)} style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 600, border: 'none',
            borderRadius: '8px 8px 0 0', cursor: 'pointer',
            background: abaAtiva === a.key ? azul : 'transparent',
            color: abaAtiva === a.key ? '#fff' : '#64748b',
            borderBottom: abaAtiva === a.key ? `2px solid ${azul}` : '2px solid transparent',
            marginBottom: -2,
          }}>{a.label}</button>
        ))}
      </div>

      {/* MUNICIPIOS */}
      {abaAtiva === 'municipios' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Resultado Base x Meta 2026 — Por Municipio</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
              <thead>
                <tr>{['Municipio', 'Votos Base', 'Meta 2026', 'Delta', '% Cresc.', '% Total'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {municipios.map((m, i) => {
                  const delta = m.meta2026 - m.votos2022;
                  const pct = m.votos2022 > 0 ? ((delta / m.votos2022) * 100).toFixed(1) : '0.0';
                  const pctTotal = totalMeta > 0 ? ((m.meta2026 / totalMeta) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{m.municipio}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{m.votos2022.toLocaleString('pt-BR')}</td>
                      <td style={tdStyle}>
                        <input type="number" value={m.meta2026}
                          onChange={e => setMunicipios(prev => prev.map((x, j) => j === i ? { ...x, meta2026: parseInt(e.target.value) || 0 } : x))}
                          style={inputMeta} />
                      </td>
                      <td style={{ ...tdStyle, color: delta >= 0 ? '#059669' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#7c3aed' }}>{delta >= 0 ? '+' : ''}{pct}%</td>
                      <td style={{ ...tdStyle, color: '#0369a1' }}>{pctTotal}%</td>
                    </tr>
                  );
                })}
                <tr style={{ background: azul }}>
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>{votosBase.toLocaleString('pt-BR')}</td>
                  <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 700 }}>{totalMeta.toLocaleString('pt-BR')}</td>
                  <td style={{ ...tdStyle, color: '#fff' }}>+{(totalMeta - votosBase).toLocaleString('pt-BR')}</td>
                  <td style={{ ...tdStyle, color: '#fff' }}>+{(((totalMeta - votosBase) / votosBase) * 100).toFixed(1)}%</td>
                  <td style={{ ...tdStyle, color: '#fff' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BAIRROS */}
      {abaAtiva === 'bairros' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Metas 2026 por Bairro — Macapa</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
              <thead>
                <tr>{['Bairro', 'Votos Base', 'Meta 2026', 'Delta', '% Cresc.', 'Prioridade'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {bairros.map((b, i) => {
                  const delta = b.meta2026 - b.votos2022;
                  const pct = b.votos2022 > 0 ? ((delta / b.votos2022) * 100).toFixed(1) : '0.0';
                  const prio = prioridade(b.meta2026);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{b.bairro}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{b.votos2022.toLocaleString('pt-BR')}</td>
                      <td style={tdStyle}>
                        <input type="number" value={b.meta2026}
                          onChange={e => setBairros(prev => prev.map((x, j) => j === i ? { ...x, meta2026: parseInt(e.target.value) || 0 } : x))}
                          style={inputMeta} />
                      </td>
                      <td style={{ ...tdStyle, color: delta >= 0 ? '#059669' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#7c3aed' }}>{delta >= 0 ? '+' : ''}{pct}%</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: prio.cor + '22', color: prio.cor }}>{prio.label}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: azul }}>
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>TOTAL MACAPA</td>
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>{totalMeta2022.toLocaleString('pt-BR')}</td>
                  <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 700 }}>{totalMetaBairros.toLocaleString('pt-BR')}</td>
                  <td colSpan={3} style={{ ...tdStyle, color: '#fff' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRAFICOS */}
      {abaAtiva === 'graficos' && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>Top 8 Municipios — Base vs Meta 2026</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartMun} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={v => v.toLocaleString('pt-BR')} />
                <Bar dataKey="2022" fill="#93c5fd" radius={[4,4,0,0]} name="Votos Base" />
                <Bar dataKey="Meta 2026" fill={azul} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Distribuicao Meta por Municipio</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={chartPizza} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartPizza.map((_, i) => <Cell key={i} fill={pizzaColors[i % pizzaColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => v.toLocaleString('pt-BR')} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Top 10 Bairros — Meta 2026</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartBairros} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip formatter={v => v.toLocaleString('pt-BR')} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="2022" fill="#93c5fd" radius={[0,4,4,0]} name="Votos Base" />
                  <Bar dataKey="Meta 2026" fill={azul} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Progresso da Meta Global</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Base: <strong>{votosBase.toLocaleString('pt-BR')}</strong></span>
              <span style={{ color: azul }}>Meta 2026: <strong>{metaGlobal.toLocaleString('pt-BR')}</strong></span>
            </div>
            <div style={{ height: 16, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((votosBase / metaGlobal) * 100, 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: 99 }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
              {((votosBase / metaGlobal) * 100).toFixed(1)}% ja conquistado (base)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
