import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function MidiaTracker({ midiaId, eleitorId }) {
  const [status, setStatus] = useState('carregando');

  useEffect(() => {
    const registrarERedirecionar = async () => {
      try {
        // Registra o clique e obtém a URL via função segura (anon não lê eleitores)
        const { data: url, error } = await supabase.rpc('registrar_clique_midia', {
          p_midia_id: midiaId,
          p_eleitor_id: eleitorId,
        });
        if (error || !url) { setStatus('erro'); return; }
        window.location.href = url;
      } catch (err) {
        console.error(err);
        setStatus('erro');
      }
    };

    if (midiaId && eleitorId) {
      registrarERedirecionar();
    } else {
      setStatus('erro');
    }
  }, [midiaId, eleitorId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      {status === 'carregando' && (
        <>
          <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando mídia...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      {status === 'erro' && (
        <p style={{ color: '#ef4444', fontSize: 14 }}>Link inválido ou expirado.</p>
      )}
    </div>
  );
}
