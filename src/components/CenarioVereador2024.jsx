import { useState } from 'react';
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

const cardStyle = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 };
const azul = '#1d4ed8';

function ZonasCard({ numero, municipio }) {
  const { zonas, loading, semDados } = useVereadorZonas(numero, municipio);
  const maxVotos = zonas?.length ? zonas[0].votos : 1;

  return (
    <div style={{ ...cardStyle }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
        Votação por Zona Eleitoral — {municipio}
      </h3>
      {loading && <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Carregando zonas...</p>}
      {semDados && !loading && <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Dados por zona não disponíveis para este candidato.</p>}
      {zonas && zonas.map(z => {
        const perc = ((z.votos / maxVotos) * 100).toFixed(0);
        const total = zonas.reduce((s, x) => s + x.votos, 0);
        const percZona = ((z.votos / total) * 100).toFixed(1);
        return (
          <div key={z.zona} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: '#2563eb', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>Zona {z.zona}</span>
                <span style={{ color: '#64748b', fontSize: 12 }}>{z.secoes} seções</span>
              </div>
              <div>
                <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 15 }}>{z.votos.toLocaleString('pt-BR')} vts</span>
                <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>{percZona}%</span>
              </div>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6 }}>
              <div style={{ height: '100%', width: `${perc}%`, background: '#2563eb', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          </div>
        );
      })}
    </div>
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

  const cresc = sel && sel.votos > 0 ? (((meta - sel.votos) / sel.votos) * 100).toFixed(1) : '0.0';

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

      {sel && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Votos 2024 (reduto {sel.municipio})</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>{sel.votos.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ background: '#fefce8', borderRadius: 12, border: '1px solid #fde68a', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Quociente vereador {sel.municipio}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{sel.qe.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ background: '#eff6ff', borderRadius: 12, border: '1.5px solid #93c5fd', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Meta 2026 Dep. Estadual (editável)</div>
              <input type="number" value={meta} onChange={e => setMeta(parseInt(e.target.value) || 0)}
                style={{ width: '100%', fontSize: 22, fontWeight: 700, color: azul, background: 'transparent', border: 'none', outline: 'none', padding: 0 }} />
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Crescimento necessário</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>+{cresc}%</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>faltam {Math.max(0, meta - sel.votos).toLocaleString('pt-BR')} votos</div>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
            ⚖️ <strong>De vereador (2024) para deputado estadual (2026):</strong> sua base de {sel.votos.toLocaleString('pt-BR')} votos está concentrada em <strong>{sel.municipio}</strong>. Para deputado estadual, o piso individual é <strong>{META_DEP_ESTADUAL.piso.toLocaleString('pt-BR')}</strong>, a meta de eleição é <strong>~{META_DEP_ESTADUAL.eleicao.toLocaleString('pt-BR')}</strong> e o quociente é <strong>{META_DEP_ESTADUAL.quociente.toLocaleString('pt-BR')}</strong>. Além de crescer <strong>{cresc}%</strong>, é preciso <strong>expandir para fora de {sel.municipio}</strong>.
          </div>

          <ZonasCard numero={sel.numero} municipio={sel.municipio} />
        </>
      )}

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