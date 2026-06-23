import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { montarComparativo } from '../lib/comparativo';
import * as XLSX from 'xlsx';

const CORES_RISCO = {
  ALTISSIMO: { bg: '#7f1d1d', fg: '#fecaca', label: 'Altíssimo' },
  ALTO: { bg: '#9a3412', fg: '#fed7aa', label: 'Alto' },
  MEDIO: { bg: '#854d0e', fg: '#fde68a', label: 'Médio' },
  BAIXO: { bg: '#334155', fg: '#cbd5e1', label: 'Baixo' },
};

export default function ComparativoInterno({ onVoltar }) {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from('comparativo_internos').select('*').order('ordem');
    setLista(data || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const { referencia, adversarios, semReferencia } = useMemo(() => montarComparativo(lista), [lista]);

  function exportar() {
    const linhas = lista.map(c => ({ nome: c.nome, votos: c.votos, cargo: c.cargo_ultima, abrangencia: c.abrangencia, risco: c.risco, confirmado: c.confirmado ? 'sim' : 'não' }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');
    XLSX.writeFile(wb, 'comparativo-interno.xlsx');
  }

  if (carregando) return <div style={{ padding: 30, color: '#94a3b8' }}>Carregando...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>🏆 Comparativo Interno — União Brasil</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportar} style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>⬇ Excel</button>
          {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
        </div>
      </div>

      {semReferencia && <p style={{ color: '#f87171' }}>Defina o candidato de referência (marque "nosso") na configuração.</p>}

      <div style={{ background: '#422006', border: '1px solid #854d0e', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#fde68a', lineHeight: 1.5 }}>
        ⚠️ <strong>Cargos e eleições diferentes não são comparáveis 1:1.</strong> Votos de prefeito ou vereador refletem só o <em>"tamanho"</em> da base que o candidato alcançou na última eleição dele (concentrada num município) — não equivalem a voto de deputado estadual, que precisa estar espalhado pelo estado todo. Use os números como referência de força, não como placar direto.
      </div>

      {referencia && (
        <div style={{ background: '#1e293b', border: '2px solid #CBA15C', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#CBA15C', fontWeight: 700 }}>⭐ NOSSO CANDIDATO (referência)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
            <span style={{ fontSize: 20, color: '#f1f5f9', fontWeight: 700 }}>{referencia.nome}</span>
            <span style={{ fontSize: 24, color: '#CBA15C', fontWeight: 800 }}>{referencia.votos.toLocaleString('pt-BR')} votos</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{referencia.cargo_ultima} · {referencia.abrangencia}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {adversarios.map(a => {
          const cor = CORES_RISCO[a.risco] || CORES_RISCO.BAIXO;
          const ahead = a.diff > 0;
          return (
            <div key={a.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>{a.nome}</span>
                <span style={{ background: cor.bg, color: cor.fg, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{cor.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '6px 0' }}>
                {a.confirmado ? a.votos.toLocaleString('pt-BR') + ' votos' : 'Estreante'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {a.cargo_ultima}{a.abrangencia !== 'Estado' && a.abrangencia !== '—' ? ` · ${a.abrangencia}` : ''}
              </div>
              {a.confirmado && a.comparacaoDireta && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: ahead ? '#f87171' : '#22c55e' }}>
                  {ahead ? '▲ +' : '▼ '}{a.diff.toLocaleString('pt-BR')} vs. nosso
                </div>
              )}
              {a.confirmado && !a.comparacaoDireta && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>cargo diferente — não comparável direto</div>
              )}
              {a.observacao && <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{a.observacao}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
