import { useState, useEffect } from 'react';
import { getOutbox } from '../lib/outbox';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendentes, setPendentes] = useState(0);

  async function atualizar() {
    const ob = await getOutbox();
    setPendentes(await ob.pendentes());
  }

  useEffect(() => {
    atualizar();
    const onUp = async () => { setOnline(true); const ob = await getOutbox(); await ob.sync(); atualizar(); };
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    const t = setInterval(atualizar, 5000);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
      clearInterval(t);
    };
  }, []);

  return { online, pendentes, atualizar };
}
