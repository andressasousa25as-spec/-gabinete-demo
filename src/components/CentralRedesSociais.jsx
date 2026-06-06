import { useState } from 'react';
import GestaoMidias from './GestaoMidias';
import AnalyticsMidias from './AnalyticsMidias';
import PainelRastreamento from './PainelRastreamento';

// Central de Redes Sociais — agrega Midias, Analytics e Links Rastreaveis
export default function CentralRedesSociais({ onVoltar, perfil }) {
  const [aba, setAba] = useState('midias');

  // Se uma sub-aba abrir tela cheia, renderiza ela diretamente
  // (GestaoMidias, AnalyticsMidias e PainelRastreamento ja tem onVoltar proprio)
  // Aqui usamos um wrapper que intercepta o onVoltar deles para voltar para a Central

  const abas = [
    { id: 'midias',      label: 'Central de Midias',    emoji: '\uD83D\uDCF8' },
    { id: 'analytics',   label: 'Analytics',            emoji: '\uD83D\uDCC8' },
    { id: 'rastreamento',label: 'Links Rastreaveis',    emoji: '\uD83D\uDD17' },
  ];

  const s = {
    container: {
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      padding: 0,
    },
    header: {
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '20px 24px 0',
    },
    voltarBtn: {
      marginBottom: 16,
      padding: '10px 20px',
      background: '#1e40af',
      color: 'white',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: 14,
    },
    titulo: {
      fontSize: 22,
      fontWeight: 800,
      color: '#60a5fa',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    tabBar: {
      display: 'flex',
      gap: 4,
      overflowX: 'auto',
      paddingBottom: 0,
    },
    tab: (ativo) => ({
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px 8px 0 0',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 13,
      background: ativo ? '#1e293b' : 'transparent',
      color: ativo ? '#60a5fa' : '#94a3b8',
      borderBottom: ativo ? '2px solid #3b82f6' : '2px solid transparent',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s',
    }),
    content: {
      background: '#0f172a',
      minHeight: 'calc(100vh - 120px)',
    },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={onVoltar} style={s.voltarBtn}>
          &#8592; Voltar
        </button>
        <div style={s.titulo}>
          <span>&#x1F4F1;</span>
          Central de Redes Sociais
        </div>
        <div style={s.tabBar}>
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              style={s.tab(aba === a.id)}
            >
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.content}>
        {/* Cada sub-componente tem seu proprio layout — onVoltar volta para esta Central */}
        {aba === 'midias' && (
          <GestaoMidias onVoltar={() => setAba('midias')} />
        )}
        {aba === 'analytics' && (
          <AnalyticsMidias onVoltar={() => setAba('analytics')} />
        )}
        {aba === 'rastreamento' && (
          <PainelRastreamento onVoltar={() => setAba('rastreamento')} />
        )}
      </div>
    </div>
  );
}
