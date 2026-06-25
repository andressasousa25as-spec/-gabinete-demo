import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function ListaAnotacoes({ liderancaId, busca = '', filtroStatus = '' }) {
  const [anotacoes, setAnotacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarAnotacoes = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('anotacoes')
      .select('*')
      .eq('lideranca_id', liderancaId)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setAnotacoes(data || []);
    setCarregando(false);
  };

  useEffect(() => {
    if (liderancaId) carregarAnotacoes();
  }, [liderancaId]);

  // Filtros
  const anotacoesFiltradas = anotacoes.filter((a) => {
    const matchBusca = 
      a.titulo.toLowerCase().includes(busca.toLowerCase()) || 
      a.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || a.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Deletar anotação
  const deletarAnotacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta anotação?')) return;

    const { error } = await supabase.from('anotacoes').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir anotação.');
    } else {
      carregarAnotacoes(); // recarrega a lista
    }
  };

  //// Imprimir / Gerar PDF (versão estável)
const imprimirRelatorio = () => {
    // Adiciona uma classe temporária para melhorar a impressão
    document.body.classList.add('print-mode');
    
    window.print();
    
    // Remove a classe depois de imprimir
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 1000);
  };

  if (carregando) return <p>Carregando anotações...</p>;

  return (
    <div>
      {/* Botão de Imprimir PDF */}
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button 
          onClick={imprimirRelatorio}
          style={{
            backgroundColor: '#166534',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* Área que será impressa */}
      <div id="area-relatorio">
        {anotacoesFiltradas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma anotação encontrada.</p>
        ) : (
          anotacoesFiltradas.map((a) => (
            <div 
              key={a.id} 
              className="anotacao"
              style={{ 
                border: '1px solid var(--border)',
                borderRadius: '12px', 
                padding: '20px',
                marginBottom: '16px',
                backgroundColor: a.status === 'Concluido' ? '#f0fdf4' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '17px' }}>{a.titulo}</strong>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    backgroundColor: a.status === 'Concluido' ? '#22c55e' : '#eab308',
                    color: 'white',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    {a.status}
                  </span>

                  {/* Botão Deletar */}
                  <button 
                    onClick={() => deletarAnotacao(a.id)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>

              <p style={{ whiteSpace: 'pre-wrap', margin: '12px 0', color: '#334155' }}>{a.descricao}</p>

              <div style={{ fontSize: '14px', color: '#475569', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {a.tipo && <span><strong>Tipo:</strong> {a.tipo}</span>}
                {a.data_followup && <span><strong>Follow-up:</strong> {new Date(a.data_followup).toLocaleDateString('pt-BR')}</span>}
              </div>

              <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                Criado em: {new Date(a.created_at).toLocaleString('pt-BR')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}