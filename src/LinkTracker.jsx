import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// Destinos fixos por canal (informação pública).
const DESTINOS = {
  instagram: 'https://www.instagram.com/paulinhoramosap/',
};

export default function LinkTracker({ canal, eleitorId }) {
  const [status, setStatus] = useState('carregando');

  useEffect(() => {
    const registrarERedirecionar = async () => {
      const destino = DESTINOS[canal];
      if (!destino) { setStatus('erro'); return; }
      try {
        // Registra o clique (canal + quem/bairro/liderança) via função segura.
        await supabase.rpc('registrar_clique_link', { p_canal: canal, p_eleitor_id: eleitorId });
      } catch (err) {
        console.warn('Falha ao registrar clique:', err);
      }
      window.location.href = destino;
    };
    if (canal && eleitorId) registrarERedirecionar();
    else setStatus('erro');
  }, [canal, eleitorId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', flexDirection: 'column', gap: 16 }}>
      {status === 'carregando' && (
        <>
          <div style={{ width: 48, height: 48, border: '4px solid #334155', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Abrindo...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      {status === 'erro' && <p style={{ color: '#ef4444', fontSize: 14 }}>Link inválido.</p>}
    </div>
  );
}
