import { useState } from 'react';
import CadastroAnotacao from './CadastroAnotacao';
import ListaAnotacoes from './ListaAnotacoes';

export default function GestaoAnotacoes({ liderancaId, onVoltar }) {
  const [recarregar, setRecarregar] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  return (
    <div style={{ padding: 30, maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>Gestao de Anotacoes</h2>
        {onVoltar && <button onClick={onVoltar} style={{ background: '#64748b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Voltar</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div style={{ background: '#111827', padding: 25, borderRadius: 16, border: '1px solid #334155', position: 'sticky', top: 20 }}>
          <h3 style={{ marginBottom: 20, color: '#1e40af' }}>Nova Anotacao</h3>
          <CadastroAnotacao liderancaId={liderancaId} onSuccess={() => setRecarregar(prev => prev + 1)} />
        </div>
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#1e40af' }}>Anotacoes</h3>
            <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ flex: 1, minWidth: 260, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <option value="">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Concluido">Concluido</option>
            </select>
          </div>
          <ListaAnotacoes liderancaId={liderancaId} busca={busca} filtroStatus={filtroStatus} key={recarregar} />
        </div>
      </div>
    </div>
  );
}