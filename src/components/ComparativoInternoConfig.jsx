import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RISCOS = ['ALTISSIMO', 'ALTO', 'MEDIO', 'BAIXO'];
const NOVO = { nome: '', votos: '', cargo_ultima: '', abrangencia: 'Estado', risco: 'MEDIO', confirmado: true, observacao: '' };

export default function ComparativoInternoConfig({ onVoltar }) {
  const [lista, setLista] = useState([]);
  const [novo, setNovo] = useState(NOVO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('comparativo_internos').select('*').order('ordem');
    // O "nosso" agora é o candidato configurado; o editor cuida só dos adversários.
    setLista((data || []).filter(c => !c.eh_nosso));
  }
  useEffect(() => { carregar(); }, []);

  async function adicionar() {
    if (!novo.nome.trim()) return alert('Informe o nome do concorrente.');
    setSalvando(true);
    const ordem = (lista.reduce((m, c) => Math.max(m, c.ordem || 0), 0)) + 1;
    const { error } = await supabase.from('comparativo_internos').insert([{
      nome: novo.nome.trim(), votos: Number(novo.votos) || 0, cargo_ultima: novo.cargo_ultima || null,
      abrangencia: novo.abrangencia, risco: novo.risco, confirmado: novo.confirmado,
      observacao: novo.observacao || null, eh_nosso: false, ordem,
    }]);
    setSalvando(false);
    if (error) return alert('Erro ao adicionar: ' + error.message);
    setNovo(NOVO);
    carregar();
  }

  async function salvar(item) {
    const { error } = await supabase.from('comparativo_internos').update({
      nome: item.nome, votos: Number(item.votos) || 0, cargo_ultima: item.cargo_ultima,
      abrangencia: item.abrangencia, risco: item.risco, confirmado: item.confirmado, observacao: item.observacao,
    }).eq('id', item.id);
    if (error) return alert('Erro ao salvar: ' + error.message);
    carregar();
  }

  async function excluir(item) {
    if (!confirm(`Remover "${item.nome}" do comparativo?`)) return;
    const { error } = await supabase.from('comparativo_internos').delete().eq('id', item.id);
    if (error) return alert('Erro ao excluir: ' + error.message);
    carregar();
  }

  function setCampo(id, campo, valor) {
    setLista(lista.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  }

  const inp = { padding: 8, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Editar comparativo — concorrentes</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
        O <strong>seu candidato</strong> é o configurado no ⚙️ Config (referência automática). Aqui você cadastra os <strong>concorrentes</strong> da sua disputa.
      </p>

      {/* Adicionar concorrente */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
        <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, margin: '0 0 10px' }}>➕ Adicionar concorrente</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input placeholder="Nome *" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} style={{ ...inp, minWidth: 160, flex: 1 }} />
          <input type="number" placeholder="Votos ref." value={novo.votos} onChange={e => setNovo({ ...novo, votos: e.target.value })} style={{ ...inp, width: 100 }} />
          <input placeholder="Cargo (última eleição)" value={novo.cargo_ultima} onChange={e => setNovo({ ...novo, cargo_ultima: e.target.value })} style={{ ...inp, width: 180 }} />
          <select value={novo.abrangencia} onChange={e => setNovo({ ...novo, abrangencia: e.target.value })} style={inp}>
            <option>Estado</option><option>Município</option><option>—</option>
          </select>
          <select value={novo.risco} onChange={e => setNovo({ ...novo, risco: e.target.value })} style={inp}>
            {RISCOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <input type="checkbox" checked={novo.confirmado} onChange={e => setNovo({ ...novo, confirmado: e.target.checked })} /> confirmado
          </label>
          <input placeholder="Observação" value={novo.observacao} onChange={e => setNovo({ ...novo, observacao: e.target.value })} style={{ ...inp, flex: 1, minWidth: 140 }} />
          <button onClick={adicionar} disabled={salvando} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>{salvando ? '...' : 'Adicionar'}</button>
        </div>
      </div>

      {/* Lista de concorrentes */}
      {lista.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 10, padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum concorrente cadastrado ainda. Use o formulário acima para adicionar os candidatos da sua disputa.
        </div>
      ) : lista.map(c => (
        <div key={c.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input value={c.nome || ''} onChange={e => setCampo(c.id, 'nome', e.target.value)} style={{ ...inp, minWidth: 150, flex: 1, fontWeight: 700 }} title="nome" />
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
          <input value={c.observacao || ''} onChange={e => setCampo(c.id, 'observacao', e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }} title="observação" />
          <button onClick={() => salvar(c)} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
          <button onClick={() => excluir(c)} title="Excluir" style={{ background: 'transparent', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>🗑️</button>
        </div>
      ))}
    </div>
  );
}
