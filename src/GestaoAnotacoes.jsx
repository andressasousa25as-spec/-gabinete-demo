import { useState, useEffect } from 'react';
import CadastroAnotacao from './CadastroAnotacao';
import ListaAnotacoes from './ListaAnotacoes';

// Hook responsividade mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function GestaoAnotacoes({ liderancaId, onVoltar }) {
  const isMobile = useIsMobile();
  const [recarregar, setRecarregar] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const handleSuccess = () => {
    setRecarregar(prev => prev + 1);
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '30px', maxWidth: '1300px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>Gestão de Anotações</h2>

        {onVoltar && (
          <button
            onClick={onVoltar}
            style={{
              background: '#64748b',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ← Voltar ao Dashboard
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '380px 1fr',
        gap: isMobile ? '24px' : '40px',
        alignItems: 'flex-start'
      }}>

        {/* Formulário de Nova Anotação */}
        <div style={{
          background: '#111827',
          padding: '25px',
          borderRadius: '16px',
          border: '1px solid #334155',
          position: isMobile ? 'relative' : 'sticky',
          top: isMobile ? 'auto' : '20px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>Nova Anotação</h3>
          <CadastroAnotacao
            liderancaId={liderancaId}
            onSuccess={handleSuccess}
          />
        </div>

        {/* Listagem com Filtros */}
        <div>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#1e40af' }}>Anotações da Liderança</h3>

            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
              }}
            />

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
              }}
            >
              <option value="">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Concluido">Concluído</option>
            </select>
          </div>

          <ListaAnotacoes
            liderancaId={liderancaId}
            busca={busca}
            filtroStatus={filtroStatus}
            key={recarregar}
          />
        </div>
      </div>
    </div>
  );
}
