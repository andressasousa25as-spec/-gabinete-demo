import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { VEREADORES_2024, calcularQuocienteEleitoral } from '../vereadores2024';
import { useVereadorZonas } from '../lib/useVereadorZonas';

const META_DEP_ESTADUAL = { piso: 1723, eleicao: 8500, quociente: 17230 };

const FONTE_2024 = Object.entries(VEREADORES_2024).flatMap(([key, dados]) =>
  (dados.candidatos || []).map(c => ({
    nome: c.nome, nomeUrna: c.nomeUrna, partido: c.partido, numero: c.numero,
    votos: c.votos, eleito: c.eleito, situacao: c.situacao,
    municipioKey: key,
    municipio: dados.municipio || (key === 'macapa' ? 'Macapá' : 'Santana'),
    qe: calcularQuocienteEleitoral(key),
  }))
);

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
const tdStyle = { padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#1e293b' };
const cardStyle = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';
const pizzaColors = ['#1d4ed8', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'];

function Tabs({ sel, meta, onMeta }) {
  const [aba, setAba] = useState('zonas');
  const { zonas, secoes, loading, semDados } = useVereadorZonas(sel.numero, sel.municipio);

  const coef = sel.votos > 0 ? (meta / sel.votos) : 1;
  const cresc = sel.votos > 0 ? (((meta - sel.votos) / sel.votos) * 100).toFixed(1) : '0.0';

  const zonasComMeta = (zonas || []).map(z => ({ ...z, meta: Math.round(z.votos * coef) }));
  const totalMeta = zonasComMeta.reduce((s, z) => s + z.meta, 0);
  const chartData = zonasComMeta.map(z => ({ name: `Z${z.zona}`, '2024': z.votos, Meta: z.meta }));
  const pizzaData = zonasComMeta.map(z => ({ name: `Zona ${z.zona}`, value: z.meta }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Votos 2024 ({sel.municipio})</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>{sel.votos.toLocaleString('pt-BR')}</div>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 12, border: '1.5px solid #93c5fd', padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Meta 2026 Dep. Estadual (editável)</div>
          <input type="number" value={meta} onChange={e => onMeta(parseInt(e.target.value) || 0)}
            style={{ width: '100%', fontSize: 22, fontWeight: 700, color: azul, background: 'transparent', border: 'none', outline: 'none', padding: 0 }} />
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Crescimento necessário</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>+{cresc}%</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>faltam {Math.max(0, meta - sel.votos).toLocaleString('pt-BR')} votos</div>
        </div>
        <div style={{ background: '#fefce8', borderRadius: 12, border: '1px solid #fde68a', padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Quociente Vereador {sel.municipio}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{sel.qe.toLocaleString('pt-BR')}</div>
        </div>
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
        ⚖️ <strong>Referências de Deputado Estadual (alvo 2026):</strong> piso individual <strong>{META_DEP_ESTADUAL.piso.toLocaleString('pt-BR')}</strong> (10% do quociente) · meta de eleição <strong>~{META_DEP_ESTADUAL.eleicao.toLocaleString('pt-BR')}</strong> (votação do último eleito) · quociente <strong>{META_DEP_ESTADUAL.quociente.toLocaleString('pt-BR')}</strong>. Além de crescer <strong>{cresc}%</strong>, é preciso <strong>expandir para fora de {sel.municipio}</strong> — a eleição de deputado é estadual.
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        {[
          { key: 'zonas', label: 'Zonas' },
          { key: 'secoes', label: `Seções${secoes ? ` (${secoes.length})` : ''}` },
          { key: 'graficos', label: 'Gráficos' },
        ].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 600, border: 'none',
            borderRadius: '8px 8px 0 0', cursor: 'pointer',
            background: aba === a.key ? azul : 'transparent',
            color: aba === a.key ? '#fff' : '#64748b',
            borderBottom: aba === a.key ? `2px solid ${azul}` : '2px solid transparent',
            marginBottom: -2,
          }}>{a.label}</button>
        ))}
      </div>

      {loading && <div style={{ ...cardStyle, color: '#94a3b8', textAlign: 'center' }}>Carregando dados por zona...</div>}
      {semDados && !loading && <div style={{ ...cardStyle, color: '#94a3b8', textAlign: 'center' }}>Dados por zona não disponíveis para este candidato.</div>}

      {!loading && !semDados && aba === 'zonas' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Votos 2024 x Meta 2026 por Zona Eleitoral</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
              <thead><tr>{['Zona', 'Votos 2024', 'Meta 2026', 'Delta', '% Cresc.'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {zonasComMeta.map((z, i) => {
                  const delta = z.meta - z.votos;
                  const pct = z.votos > 0 ? ((delta / z.votos) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>Zona {z.zona}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{z.votos.toLocaleString('pt-BR')}</td>
                      <td style={tdStyle}><span style={{ fontWeight: 700, color: azul }}>{z.meta.toLocaleString('pt-BR')}</span></td>
                      <td style={{ ...tdStyle, color: delta >= 0 ? '#059669' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: '#7c3aed' }}>+{pct}%</td>
                    </tr>
                  );
                })}
                <tr style={{ background: azul }}>
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>{sel.votos.toLocaleString('pt-BR')}</td>
                  <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 700 }}>{totalMeta.toLocaleString('pt-BR')}</td>
                  <td colSpan={2} style={{ ...tdStyle, color: '#fff' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !semDados && aba === 'secoes' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Seções Eleitorais — Dados TSE 2024</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8' }}>{secoes?.length} seções em {sel.municipio}</p>
          <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0 }}>
                  {['Zona', 'Seção', 'Votos 2024'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(secoes || []).map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={tdStyle}>Zona {s.nr_zona}</td>
                    <td style={tdStyle}>{s.nr_secao}</td>
                    <td style={{ ...tdStyle, color: azul, fontWeight: 700 }}>{s.qt_votos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !semDados && aba === 'graficos' && (
        <div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>Zonas — 2024 vs Meta 2026</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={v => v.toLocaleString('pt-BR')} />
                <Bar dataKey="2024" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Votos 2024" />
                <Bar dataKey="Meta" fill={azul} radius={[4, 4, 0, 0]} name="Meta 2026" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Distribuição por Zona</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pizzaData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pizzaData.map((_, i) => <Cell key={i} fill={pizzaColors[i % pizzaColors.length]} />)}
                </Pie>
                <Tooltip formatter={v => v.toLocaleString('pt-BR')} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Progresso da Meta</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Base 2024: <strong>{sel.votos.toLocaleString('pt-BR')}</strong></span>
              <span style={{ color: azul }}>Meta 2026: <strong>{meta.toLocaleString('pt-BR')}</strong></span>
            </div>
            <div style={{ height: 16, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((sel.votos / meta) * 100, 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: 99 }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
              {((sel.votos / meta) * 100).toFixed(1)}% já conquistado (base 2024)
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CenarioVereador2024({ onVoltar }) {
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState(null);
  const [meta, setMeta] = useState(META_DEP_ESTADUAL.eleicao);

  const filtrados = FONTE_2024.filter(c => {
    const q = busca.toLowerCase();
    return c.nome.toLowerCase().includes(q) || (c.nomeUrna || '').toLowerCase().includes(q) || (c.partido || '').toLowerCase().includes(q);
  }).slice(0, 60);

  const selecionar = (c) => { setSel(c); setMeta(Math.max(META_DEP_ESTADUAL.eleicao, Math.round(c.votos * 1.2))); setBusca(''); };

  return (
    <div style={{ padding: '0 0 40px', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {onVoltar && <button onClick={onVoltar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>←</button>}
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cenário Vereador 2024 → Deputado 2026</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Dados reais TSE 2024 — Macapá e Santana</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Selecione o Candidato (vereador 2024)</h3>
        <input type="text" placeholder="Buscar vereador pelo nome ou partido..." value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        {sel && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: azul, fontSize: 15 }}>{sel.nomeUrna || sel.nome}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Vereador {sel.municipio} · {sel.partido} · {sel.votos.toLocaleString('pt-BR')} votos em 2024 · {sel.situacao}</p>
            </div>
            <button onClick={() => { setSel(null); setBusca(''); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Trocar</button>
          </div>
        )}
        {busca && !sel && (
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            {filtrados.length === 0 ? (
              <p style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Nenhum vereador encontrado.</p>
            ) : filtrados.map((c, i) => (
              <div key={i} onClick={() => selecionar(c)}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.nomeUrna || c.nome}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Vereador {c.municipio} · {c.partido}{c.eleito ? ' · ELEITO' : ''}</p>
                </div>
                <span style={{ fontWeight: 700, color: azul, fontSize: 14 }}>{c.votos.toLocaleString('pt-BR')} votos</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {sel && <Tabs sel={sel} meta={meta} onMeta={setMeta} />}

      {!sel && !busca && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: 48 }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Busque um vereador acima</p>
          <p style={{ fontSize: 13 }}>{FONTE_2024.length} candidatos a vereador (2024) — Macapá e Santana</p>
        </div>
      )}
    </div>
  );
}