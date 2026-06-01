import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function VisualizarMidia({ midiaId, eleitorId }) {
  const [status, setStatus] = useState('carregando');

  useEffect(() => {
    const registrar = async () => {
      try {
        const { data: midia, error } = await supabase
          .from('midias')
          .select('id, arquivo_url, titulo')
          .eq('id', midiaId)
          .single();

        if (error || !midia) { setStatus('erro'); return; }

        const { data: eleitor } = await supabase
          .from('eleitores')
          .select('bairro, lideranca_id')
          .eq('id', eleitorId)
          .single();

        await supabase.from('midias_cliques').insert({
          midia_id: midiaId,
          eleitor_id: eleitorId,
          bairro: eleitor?.bairro || null,
          lideranca_id: eleitor?.lideranca_id || null,
          data_clique: new Date().toISOString(),
        });

        setStatus('redirecionando');
        window.location.href = midia.arquivo_url;
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