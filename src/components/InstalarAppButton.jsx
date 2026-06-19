import { useState, useEffect } from 'react';

export default function InstalarAppButton() {
  const [prompt, setPrompt] = useState(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalado(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (instalado || !prompt) return null;

  return (
    <button
      onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}
      style={{ background: '#CBA15C', color: '#0E2236', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
    >
      📲 Instalar app
    </button>
  );
}
