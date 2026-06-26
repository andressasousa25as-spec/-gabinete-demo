import { useState } from 'react';
import { lerTema, alternarTema } from '../lib/tema';

// Botão que alterna claro/escuro e mostra o ícone do modo atual.
export default function BotaoTema() {
  const [modo, setModo] = useState(lerTema());
  const trocar = () => setModo(alternarTema());
  return (
    <button
      onClick={trocar}
      title={modo === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label="Alternar tema"
      style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 999, fontSize: 14, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {modo === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
