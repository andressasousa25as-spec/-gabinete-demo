import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// Resolve o destino do instagram dinamicamente via config_candidato.
// Rota pública — anon user pode ou não ter acesso dependendo do RLS.
async function resolverDestino(canal) {
  if (canal === 'instagram') {
    try {
      const { data } = await supabase.from('config_candidato').select('instagram').limit(1).maybeSingle();
      if (data?.instagram) return data.instagram;
    } catch (err) {
      console.warn('Não foi possível ler config_candidato (RLS?):', err);
    }
    return window.location.origin;
  }
  return null;
}

export default function LinkTracker({ canal, eleitorId }) {
  const [status, setStatus] = useState('carregando');

  useEffect(() => {
    const registrarERedirecionar = async () => {
      const destino = await resolverDestino(canal);
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      {status === 'carregando' && (
        <>
          <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Abrindo...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      {status === 'erro' && <p style={{ color: '#ef4444', fontSize: 14 }}>Link inválido.</p>}
    </div>
  );
}
