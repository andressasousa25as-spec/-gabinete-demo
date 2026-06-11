import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function VisualizarMidia({ midiaId, eleitorId }) {
  const [status, setStatus] = useState('carregando');

  useEffect(() => {
    const registrar = async () => {
      try {
        const { data: url, error } = await supabase.rpc('registrar_clique_midia', {
          p_midia_id: midiaId,
          p_eleitor_id: eleitorId,
        });
        if (error || !url) { setStatus('erro'); return; }
        setStatus('redirecionando');
        window.location.href = url;
      } catch (err) {
        setStatus('erro');
      }
    };

    if (midiaId && eleitorId) registrar();
    else setStatus('erro');
  }, [midiaId, eleitorId]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
      {status === 'carregando' && <p style={{ fontSize: '18px', color: '#94a3b8' }}>Carregando midia...</p>}
      {status === 'redirecionando' && <p style={{ fontSize: '18px', color: '#94a3b8' }}>Redirecionando...</p>}
      {status === 'erro' && <p style={{ fontSize: '18px', color: '#f87171' }}>Link invalido ou expirado.</p>}
    </div>
  );
}