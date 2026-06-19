import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// Hook responsividade mobile (mesmo padrão do resto do sistema)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const CATEGORIAS = ['Saúde', 'Educação', 'Infraestrutura', 'Assistência Social', 'Emprego', 'Documentação', 'Segurança', 'Outro'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

// Colunas do fluxo (kanban) + estado final "Cancelada" fora do board
const COLUNAS = [
  { status: 'Aberta', titulo: '📥 Abertas', cor: '#f59e0b' },
  { status: 'Em andamento', titulo: '🔄 Em andamento', cor: '#3b82f6' },
  { status: 'Resolvida', titulo: '✅ Resolvidas', cor: '#22c55e' },
];

const corPrioridade = (p) => ({
  'Urgente': '#dc2626', 'Alta': '#ea580c', 'Média': '#ca8a04', 'Baixa': '#64748b'
}[p] || '#64748b');

export default function GestaoDemandas({ eleitores = [], liderancas = [], onVoltar, registrarLog }) {
  const isMobile = useIsMobile();
  const [demandas, setDemandas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');

  const formVazio = {
    eleitor_id: '', titulo: '', descricao: '', categoria: '',
    prioridade: 'Média', prazo: '', responsavel: ''
  };
  const [form, setForm] = useState(formVazio);

  const nomeEleitor = useMemo(() => {
    const map = {};
    eleitores.forEach(e => { map[e.id] = e.nome; });
    return map;
  }, [eleitores]);

  async function carregar() {
    try {
      setLoading(true);
      setErro('');
      const { data, error } = await supabase
        .from('demandas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDemandas(data || []);
    } catch (err) {
      setErro('Erro ao carregar demandas. Verifique se a tabela "demandas" existe no banco.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function criarDemanda(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const eleitor = eleitores.find(el => el.id === form.eleitor_id);
      const { error } = await supabase.from('demandas').insert([{
        eleitor_id: form.eleitor_id || null,
        lideranca_id: eleitor?.lideranca_id || null,
        titulo: form.titulo,
        descricao: form.descricao || null,
        categoria: form.categoria || null,
        prioridade: form.prioridade,
        prazo: form.prazo || null,
        responsavel: form.responsavel || null,
        status: 'Aberta',
      }]);
      if (error) throw error;
      if (registrarLog) registrarLog('Criou demanda', `${form.titulo}${eleitor ? ' — ' + eleitor.nome : ''}`);
      setForm(formVazio);
      setShowForm(false);
      await carregar();
    } catch (err) {
      setErro('Erro ao salvar a demanda.');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  async function mudarStatus(demanda, novoStatus) {
    try {
      const patch = { status: novoStatus, updated_at: new Date().toISOString() };
      if (novoStatus === 'Resolvida') patch.resolvida_em = new Date().toISOString();
      const { error } = await supabase.from('demandas').update(patch).eq('id', demanda.id);
      if (error) throw error;
      if (registrarLog) registrarLog('Atualizou demanda', `${demanda.titulo} → ${novoStatus}`);
      setDemandas(prev => prev.map(d => d.id === demanda.id ? { ...d, ...patch } : d));
    } catch (err) {
      alert('Erro ao atualizar status.');
      console.error(err);
    }
  }

  async function excluir(demanda) {
    if (!window.confirm(`Excluir a demanda "${demanda.titulo}"?`)) return;
    try {
      const { error } = await supabase.from('demandas').delete().eq('id', demanda.id);
      if (error) throw error;
      setDemandas(prev => prev.filter(d => d.id !== demanda.id));
    } catch (err) {
      alert('Erro ao excluir.');
      console.error(err);
    }
  }

  // Aplica filtros
  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    return demandas.filter(d => {
      if (filtroCategoria && d.categoria !== filtroCategoria) return false;
      if (filtroPrioridade && d.prioridade !== filtroPrioridade) return false;
      if (q) {
        const alvo = `${d.titulo || ''} ${d.descricao || ''} ${nomeEleitor[d.eleitor_id] || ''}`.toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [demandas, busca, filtroCategoria, filtroPrioridade, nomeEleitor]);

  const total = demandas.length;
  const abertas = demandas.filter(d => d.status === 'Aberta').length;
  const andamento = demandas.filter(d => d.status === 'Em andamento').length;
  const resolvidas = demandas.filter(d => d.status === 'Resolvida').length;

  const inputStyle = {
    width: '100%', padding: '10px', marginBottom: '10px', background: '#0f172a',
    color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box'
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '30px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>🗂️ Gestão de Demandas</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowForm(s => !s)} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {showForm ? '✕ Fechar' : '+ Nova Demanda'}
          </button>
          {onVoltar && (
            <button onClick={onVoltar} style={{ background: '#64748b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
              ← Voltar
            </button>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', valor: total, cor: '#94a3b8' },
          { label: 'Abertas', valor: abertas, cor: '#f59e0b' },
          { label: 'Em andamento', valor: andamento, cor: '#3b82f6' },
          { label: 'Resolvidas', valor: resolvidas, cor: '#22c55e' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {erro && <p style={{ color: '#f87171', background: '#7f1d1d33', padding: 12, borderRadius: 8 }}>{erro}</p>}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={criarDemanda} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ color: '#f1f5f9', marginTop: 0, marginBottom: 16, fontSize: 16 }}>Registrar pedido do eleitor</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <select name="eleitor_id" value={form.eleitor_id} onChange={handleChange} style={inputStyle}>
              <option value="">Vincular eleitor (opcional)</option>
              {eleitores.map(e => <option key={e.id} value={e.id}>{e.nome}{e.bairro ? ' — ' + e.bairro : ''}</option>)}
            </select>
            <input name="titulo" placeholder="Título do pedido *" value={form.titulo} onChange={handleChange} required style={inputStyle} />
          </div>
          <textarea name="descricao" placeholder="Descrição do que foi pedido..." value={form.descricao} onChange={handleChange} rows={3} style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 12 }}>
            <select name="categoria" value={form.categoria} onChange={handleChange} style={inputStyle}>
              <option value="">Categoria</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="prioridade" value={form.prioridade} onChange={handleChange} style={inputStyle}>
              {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="date" name="prazo" value={form.prazo} onChange={handleChange} style={inputStyle} title="Prazo" />
            <input name="responsavel" placeholder="Responsável" value={form.responsavel} onChange={handleChange} style={inputStyle} />
          </div>
          <button type="submit" disabled={salvando} style={{ padding: '12px 30px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {salvando ? 'Salvando...' : '✅ Registrar Demanda'}
          </button>
        </form>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input placeholder="🔍 Buscar por título, descrição ou eleitor..." value={busca} onChange={e => setBusca(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }} />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ ...inputStyle, width: 'auto', marginBottom: 0 }}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} style={{ ...inputStyle, width: 'auto', marginBottom: 0 }}>
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Carregando demandas...</p>
      ) : (
        /* Kanban */
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, alignItems: 'flex-start' }}>
          {COLUNAS.map(col => {
            const itens = filtradas.filter(d => d.status === col.status);
            return (
              <div key={col.status} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${col.cor}` }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{col.titulo}</span>
                  <span style={{ background: col.cor, color: '#0f172a', borderRadius: 20, padding: '1px 10px', fontSize: 12, fontWeight: 800 }}>{itens.length}</span>
                </div>

                {itens.length === 0 && <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhuma demanda.</p>}

                {itens.map(d => (
                  <div key={d.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{d.titulo}</span>
                      <span style={{ background: corPrioridade(d.prioridade), color: 'white', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{d.prioridade}</span>
                    </div>
                    {d.descricao && <p style={{ color: '#cbd5e1', fontSize: 13, margin: '6px 0' }}>{d.descricao}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: '#94a3b8', margin: '6px 0' }}>
                      {d.eleitor_id && nomeEleitor[d.eleitor_id] && <span>👤 {nomeEleitor[d.eleitor_id]}</span>}
                      {d.categoria && <span>🏷️ {d.categoria}</span>}
                      {d.responsavel && <span>🙋 {d.responsavel}</span>}
                      {d.prazo && <span>⏰ {new Date(d.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {col.status === 'Aberta' && <button onClick={() => mudarStatus(d, 'Em andamento')} style={btnAcao('#3b82f6')}>▶ Iniciar</button>}
                      {col.status === 'Em andamento' && <button onClick={() => mudarStatus(d, 'Resolvida')} style={btnAcao('#22c55e')}>✓ Resolver</button>}
                      {col.status === 'Resolvida' && <button onClick={() => mudarStatus(d, 'Em andamento')} style={btnAcao('#64748b')}>↩ Reabrir</button>}
                      <button onClick={() => excluir(d)} style={btnAcao('#dc2626')}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btnAcao = (cor) => ({
  background: cor, color: 'white', border: 'none', borderRadius: 6,
  padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600
});
