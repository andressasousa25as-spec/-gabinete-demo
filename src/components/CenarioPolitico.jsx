import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CANDIDATOS_TSE } from '../candidatosTSE';

function prioridade(meta) {
  if (meta >= 700) return { label: 'CRITICO', cor: '#ef4444' };
  if (meta >= 300) return { label: 'ALTO', cor: '#f97316' };
  if (meta >= 100) return { label: 'MEDIO', cor: '#eab308' };
  return { label: 'BAIXO', cor: '#22c55e' };
}

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
const tdStyle = { padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#1e293b' };
const inputMeta = { width: 80, padding: '5px 8px', border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', fontSize: 13, color: '#1d4ed8', textAlign: 'center', fontWeight: 700 };
const azul = '#1d4ed8';
const cardStyle = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };

export default function CenarioPolitico({ onVoltar }) {
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('municipios');
  const [metaGlobal, setMetaGlobal] = useState(7000);
  const [municipios, setMunicipios] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [secoes, setSecoes] = useState([]);
  const [buscaSecao, setBuscaSecao] = useState('');
  const [filtroMunSecao, setFiltroMunSecao] = useState('');

  const candidatosFiltrados = CANDIDATOS_TSE.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  const selecionarCandidato = (c) => {
    setCandidatoSelecionado(c);
    const meta = Math.round(c.total * 1.43);
    setMetaGlobal(meta);
    const coef = meta / c.total;
    setMunicipios(
      Object.entries(c.municipios).map(([nome, votos]) => ({
        municipio: nome, votos2022: votos, meta2026: Math.round(votos * coef)
      })).sort((a, b) => b.votos2022 - a.votos2022)
    );
    setZonas(
      Object.entries(c.zonas).map(([zona, votos]) => ({
        zona: `Zona ${zona}`, votos2022: votos, meta2026: Math.round(votos * coef)
      })).sort((a, b) => b.votos2022 - a.votos2022)
    );
    setSecoes(c.secoes || []);
    setAbaAtiva('municipios');
    setBuscaSecao('');
    setFiltroMunSecao('');
  };

  const aplicarMeta = (novaMeta) => {
    if (!candidatoSelecionado) return;
    setMetaGlobal(novaMeta);
    const coef = novaMeta / candidatoSelecionado.total;
    setMunicipios(prev => prev.map(m => ({ ...m, meta2026: Math.round(m.votos2022 * coef) })));
    setZonas(prev => prev.map(z => ({ ...z, meta2026: Math.round(z.votos2022 * coef) })));
  };

  const totalMeta = municipios.reduce((s, m) => s + m.meta2026, 0);
  const totalZonas = zonas.reduce((s, z) => s + z.meta2026, 0);
  const pizzaColors = ['#1d4ed8','#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#dbeafe'];
  const chartMun = municipios.slice(0,8).map(m => ({ name: m.municipio.slice(0,12), '2022': m.votos2022, 'Meta': m.meta2026 }));
  const chartPizza = municipios.map(m => ({ name: m.municipio, value: m.meta2026 }));

  const municipiosUnicos = [...new Set(secoes.map(s => s.municipio))].sort();
  const secoesFiltradas = secoes.filter(s => {
    const matchMun = !filtroMunSecao || s.municipio === filtroMunSecao;
    const matchBusca = !buscaSecao || 
      (s.local || '').toLowerCase().includes(buscaSecao.toLowerCase()) || 
      (s.secao || '').includes(buscaSecao) || 
      (s.zona || '').includes(buscaSecao);
    return matchMun && matchBusca;
  });

  return (
    <div style={{ padding: '0 0 40px', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {onVoltar && <button onClick={onVoltar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>←</button>}
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cenario Politico 2026</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Dados reais TSE 2022 — Amapa</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Selecione o Candidato</h3>
        <input type="text" placeholder="Buscar candidato pelo nome ou cargo..." value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        {candidatoSelecionado && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: azul, fontSize: 15 }}>{candidatoSelecionado.nome}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{candidatoSelecionado.cargo} • {candidatoSelecionado.total.toLocaleString('pt-BR')} votos em 2022</p>
            </div>
            <button onClick={() => { setCandidatoSelecionado(null); setBusca(''); setSecoes([]); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Trocar</button>
          </div>
        )}
        {busca && !candidatoSelecionado && (
          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            {candidatosFiltrados.length === 0 ? (
              <p style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Nenhum candidato encontrado</p>
            ) : candidatosFiltrados.map((c, i) => (
              <div key={i} onClick={() => { selecionarCandidato(c); setBusca(''); }}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{c.nome}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{c.cargo}</p>
                </div>
                <span style={{ fontWeight: 700, color: azul, fontSize: 14 }}>{c.total.toLocaleString('pt-BR')} votos</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {candidatoSelecionado && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Votos 2022</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>{candidatoSelecionado.total.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ background: '#eff6ff', borderRadius: 12, border: '1.5px solid #93c5fd', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Meta 2026 (editavel)</div>
              <input type="number" value={metaGlobal} onChange={e => aplicarMeta(parseInt(e.target.value) || 0)}
                style={{ width: '100%', fontSize: 22, fontWeight: 700, color: azul, background: 'transparent', border: 'none', outline: 'none', padding: 0 }} />
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Crescimento</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>+{(((metaGlobal - candidatoSelecionado.total) / candidatoSelecionado.total) * 100).toFixed(1)}%</div>
            </div>
            <div style={{ background: '#fefce8', borderRadius: 12, border: '1px solid #fde68a', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Coeficiente</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{(metaGlobal / candidatoSelecionado.total).toFixed(3)}x</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
            {[
              { key: 'municipios', label: 'Municipios' },
              { key: 'zonas', label: 'Zonas' },
              { key: 'secoes', label: `Secoes (${secoes.length})` },
              { key: 'graficos', label: 'Graficos' },
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

          {abaAtiva === 'municipios' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Votos 2022 x Meta 2026 por Municipio</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
                  <thead><tr>{['Municipio','Votos 2022','Meta 2026','Delta','% Cresc.','Prioridade'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {municipios.map((m, i) => {
                      const delta = m.meta2026 - m.votos2022;
                      const pct = m.votos2022 > 0 ? ((delta / m.votos2022) * 100).toFixed(1) : '0.0';
                      const prio = prioridade(m.meta2026);
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{m.municipio}</td>
                          <td style={{ ...tdStyle, color: '#64748b' }}>{m.votos2022.toLocaleString('pt-BR')}</td>
                          <td style={tdStyle}><input type="number" value={m.meta2026} onChange={e => setMunicipios(prev => prev.map((x, j) => j === i ? { ...x, meta2026: parseInt(e.target.value) || 0 } : x))} style={inputMeta} /></td>
                          <td style={{ ...tdStyle, color: delta >= 0 ? '#059669' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}</td>
                          <td style={{ ...tdStyle, color: '#7c3aed' }}>{delta >= 0 ? '+' : ''}{pct}%</td>
                          <td style={tdStyle}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: prio.cor + '22', color: prio.cor }}>{prio.label}</span></td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: azul }}>
                      <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>TOTAL</td>
                      <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>{candidatoSelecionado.total.toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 700 }}>{totalMeta.toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#fff' }}>+{(totalMeta - candidatoSelecionado.total).toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#fff' }}>+{(((totalMeta - candidatoSelecionado.total) / candidatoSelecionado.total) * 100).toFixed(1)}%</td>
                      <td style={{ ...tdStyle, color: '#fff' }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {abaAtiva === 'zonas' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Votos 2022 x Meta 2026 por Zona Eleitoral</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
                  <thead><tr>{['Zona','Votos 2022','Meta 2026','Delta','% Cresc.'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {zonas.map((z, i) => {
                      const delta = z.meta2026 - z.votos2022;
                      const pct = z.votos2022 > 0 ? ((delta / z.votos2022) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{z.zona}</td>
                          <td style={{ ...tdStyle, color: '#64748b' }}>{z.votos2022.toLocaleString('pt-BR')}</td>
                          <td style={tdStyle}><input type="number" value={z.meta2026} onChange={e => setZonas(prev => prev.map((x, j) => j === i ? { ...x, meta2026: parseInt(e.target.value) || 0 } : x))} style={inputMeta} /></td>
                          <td style={{ ...tdStyle, color: delta >= 0 ? '#059669' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}</td>
                          <td style={{ ...tdStyle, color: '#7c3aed' }}>{delta >= 0 ? '+' : ''}{pct}%</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: azul }}>
                      <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>TOTAL</td>
                      <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>{candidatoSelecionado.total.toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 700 }}>{totalZonas.toLocaleString('pt-BR')}</td>
                      <td colSpan={2} style={{ ...tdStyle, color: '#fff' }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {abaAtiva === 'secoes' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Locais de Votacao — Dados TSE 2022</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8' }}>Informativo — nao afeta o calculo de projecao</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <select value={filtroMunSecao} onChange={e => setFiltroMunSecao(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="">Todos os Municipios</option>
                  {municipiosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" placeholder="Buscar por local, zona ou secao..." value={buscaSecao}
                  onChange={e => setBuscaSecao(e.target.value)}
                  style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                <span style={{ padding: '8px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  {secoesFiltradas.length} secoes
                </span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0 }}>
                      {['Municipio','Zona','Secao','Votos 2022','Local de Votacao','Endereco'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {secoesFiltradas.slice(0, 200).map((s, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{s.municipio}</td>
                        <td style={tdStyle}>Zona {s.zona}</td>
                        <td style={tdStyle}>{s.secao}</td>
                        <td style={{ ...tdStyle, color: azul, fontWeight: 700 }}>{s.votos}</td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{s.local}</td>
                        <td style={{ ...tdStyle, fontSize: 11, color: '#64748b' }}>{s.endereco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {secoesFiltradas.length > 200 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: 12, fontSize: 13 }}>
                    Mostrando 200 de {secoesFiltradas.length}. Use os filtros para refinar.
                  </p>
                )}
              </div>
            </div>
          )}

          {abaAtiva === 'graficos' && (
            <div>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>Top 8 Municipios — 2022 vs Meta 2026</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartMun} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={v => v.toLocaleString('pt-BR')} />
                    <Bar dataKey="2022" fill="#93c5fd" radius={[4,4,0,0]} name="Votos 2022" />
                    <Bar dataKey="Meta" fill={azul} radius={[4,4,0,0]} name="Meta 2026" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Distribuicao por Municipio</h3>
                <ResponsiveContainer width="100%" height={260}>
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
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Progresso da Meta Global</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Base 2022: <strong>{candidatoSelecionado.total.toLocaleString('pt-BR')}</strong></span>
                  <span style={{ color: azul }}>Meta 2026: <strong>{metaGlobal.toLocaleString('pt-BR')}</strong></span>
                </div>
                <div style={{ height: 16, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((candidatoSelecionado.total / metaGlobal) * 100, 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: 99 }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                  {((candidatoSelecionado.total / metaGlobal) * 100).toFixed(1)}% ja conquistado (base 2022)
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!candidatoSelecionado && !busca && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: 48 }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Busque um candidato acima</p>
          <p style={{ fontSize: 13 }}>{CANDIDATOS_TSE.length} candidatos disponiveis — dados reais TSE 2022</p>
        </div>
      )}
    </div>
  );
}
