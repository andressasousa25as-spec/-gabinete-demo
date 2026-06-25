import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ApuracaoConfig({ onVoltar }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ nome: '', numero: '', partido: '', eh_nosso: false });
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('apuracao_candidatos').select('*').order('ordem');
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function adicionar(e) {
    e.preventDefault();
    setCarregando(true);
    await supabase.from('apuracao_candidatos').insert({ ...form, ordem: lista.length });
    setForm({ nome: '', numero: '', partido: '', eh_nosso: false });
    setCarregando(false);
    carregar();
  }
  async function remover(id) {
    if (!window.confirm('Remover este candidato?')) return;
    await supabase.from('apuracao_candidatos').delete().eq('id', id);
    carregar();
  }

  const inp = { padding: 10, marginRight: 8, marginBottom: 8, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 };
  return (
    <div style={{ padding: 30, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Candidatos acompanhados</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>}
      </div>
      <form onSubmit={adicionar} style={{ marginBottom: 20 }}>
        <input placeholder="Nome de urna *" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required style={inp} />
        <input placeholder="Número" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} style={inp} />
        <input placeholder="Partido" value={form.partido} onChange={e => setForm({ ...form, partido: e.target.value })} style={inp} />
        <label style={{ color: 'var(--text)', marginRight: 8 }}>
          <input type="checkbox" checked={form.eh_nosso} onChange={e => setForm({ ...form, eh_nosso: e.target.checked })} /> Nosso candidato
        </label>
        <button type="submit" disabled={carregando} style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>+ Adicionar</button>
      </form>
      {lista.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.eh_nosso ? 'var(--surface)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <span style={{ color: 'var(--text)' }}>{c.eh_nosso ? '⭐ ' : ''}{c.nome} {c.numero ? `(${c.numero})` : ''} {c.partido || ''}</span>
          <button onClick={() => remover(c.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>🗑️</button>
        </div>
      ))}
    </div>
  );
}
