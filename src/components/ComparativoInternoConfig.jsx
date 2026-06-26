import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RISCOS = ['ALTISSIMO', 'ALTO', 'MEDIO', 'BAIXO'];

export default function ComparativoInternoConfig({ onVoltar }) {
  const [lista, setLista] = useState([]);

  async function carregar() {
    const { data } = await supabase.from('comparativo_internos').select('*').order('ordem');
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(item) {
    await supabase.from('comparativo_internos').update({
      votos: Number(item.votos) || 0,
      cargo_ultima: item.cargo_ultima,
      abrangencia: item.abrangencia,
      risco: item.risco,
      confirmado: item.confirmado,
      observacao: item.observacao,
    }).eq('id', item.id);
    carregar();
  }
  function setCampo(id, campo, valor) {
    setLista(lista.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  }

  const inp = { padding: 8, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 };
  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Editar comparativo</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
      </div>
      {lista.map(c => (
        <div key={c.id} style={{ background: c.eh_nosso ? 'var(--surface)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <strong style={{ color: 'var(--text)', minWidth: 140 }}>{c.eh_nosso ? '⭐ ' : ''}{c.nome}</strong>
          <input type="number" value={c.votos} onChange={e => setCampo(c.id, 'votos', e.target.value)} style={{ ...inp, width: 90 }} title="votos" />
          <input value={c.cargo_ultima || ''} onChange={e => setCampo(c.id, 'cargo_ultima', e.target.value)} style={{ ...inp, width: 170 }} title="cargo" />
          <select value={c.abrangencia || '—'} onChange={e => setCampo(c.id, 'abrangencia', e.target.value)} style={inp}>
            <option>Estado</option><option>Município</option><option>—</option>
          </select>
          <select value={c.risco} onChange={e => setCampo(c.id, 'risco', e.target.value)} style={inp}>
            {RISCOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <input type="checkbox" checked={c.confirmado} onChange={e => setCampo(c.id, 'confirmado', e.target.checked)} /> confirmado
          </label>
          <input value={c.observacao || ''} onChange={e => setCampo(c.id, 'observacao', e.target.value)} style={{ ...inp, flex: 1, minWidth: 160 }} title="observação" />
          <button onClick={() => salvar(c)} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
        </div>
      ))}
    </div>
  );
}
