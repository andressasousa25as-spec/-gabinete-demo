import { useState, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

// Mostra um aviso quando há uma versão nova do app; ao tocar, atualiza e recarrega.
export default function AtualizacaoPWA() {
  const [precisa, setPrecisa] = useState(false);
  const [atualizar, setAtualizar] = useState(() => () => {});

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() { setPrecisa(true); },
      onRegisteredSW(_swUrl, r) {
        // iOS não checa atualização sozinho — força verificação a cada 60s.
        if (r) {
          setInterval(() => { r.update().catch(() => {}); }, 60 * 1000);
        }
      },
    });
    setAtualizar(() => () => updateSW(true));
  }, []);

  if (!precisa) return null;

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: '#0E2236', borderTop: '2px solid #CBA15C', padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <span style={{ color: 'var(--text)', fontSize: 14 }}>✨ Nova versão disponível.</span>
      <button onClick={atualizar} style={{
        background: '#CBA15C', color: '#0E2236', border: 'none', borderRadius: 8,
        padding: '8px 18px', fontWeight: 700, cursor: 'pointer',
      }}>Atualizar agora</button>
    </div>
  );
}
