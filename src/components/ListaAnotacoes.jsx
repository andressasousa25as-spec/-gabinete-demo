import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ListaAnotacoes({ liderancaId, busca = '', filtroStatus = '' }) {
  const [anotacoes, setAnotacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarAnotacoes = async () => {
    setCarregando(true);
    const { data, error } = await supabase.from('anotacoes').select('*').eq('lideranca_id', liderancaId).order('created_at', { ascending: false });
    if (error) console.error(error);
    else setAnotacoes(data || []);
    setCarregando(false);
  };

  useEffect(() => { if (liderancaId) carregarAnotacoes(); }, [liderancaId]);

  const anotacoesFiltradas = anotacoes.filter((a) => {
    const matchBusca = a.titulo.toLowerCase().includes(busca.toLowerCase()) || a.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || a.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const deletarAnotacao = async (id) => {
    if (!window.confirm('Excluir esta anotacao?')) return;
    const { error } = await supabase.from('anotacoes').delete().eq('id', id);
    if (error) alert('Erro ao excluir.');
    else carregarAnotacoes();
  };

  if (carregando) return <p style={{ color: '#94a3b8' }}>Carregando anotacoes...</p>;

  return (
    <div>
      <div style={{ marginBottom: 20, textAlign: 'right' }}>
        <button onClick={() => window.print()} style={{ backgroundColor: '#166534', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
          Imprimir / PDF
        </button>
      </div>
      {anotacoesFiltradas.length === 0 ? <p style={{ color: '#64748b' }}>Nenhuma anotacao encontrada.</p> :
        anotacoesFiltradas.map((a) => (
          <div key={a.id} style={{ border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 16, backgroundColor: a.status === 'Concluido' ? '#f0fdf4' : '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <strong style={{ fontSize: 17 }}>{a.titulo}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ backgroundColor: a.status === 'Concluido' ? '#22c55e' : '#eab308', color: 'white', padding: '3px 12px', borderRadius: 20, fontSize: 12 }}>{a.status}</span>
                <button onClick={() => deletarAnotacao(a.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', margin: '12px 0', color: '#334155' }}>{a.descricao}</p>
            <div style={{ fontSize: 14, color: '#475569', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {a.tipo && <span><strong>Tipo:</strong> {a.tipo}</span>}
              {a.data_followup && <span><strong>Follow-up:</strong> {new Date(a.data_followup).toLocaleDateString('pt-BR')}</span>}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>Criado em: {new Date(a.created_at).toLocaleString('pt-BR')}</div>
          </div>
        ))
      }
    </div>
  );
}