import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import VisualizarMidia from './components/VisualizarMidia';

function App() {
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [candidato, setCandidato] = useState('');
  const [rotaMidia, setRotaMidia] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/m\/([^/]+)\/([^/]+)/);
    if (match) {
      setRotaMidia({ midiaId: match[1], eleitorId: match[2] });
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const nome = params.get('candidato') || 'Candidato Demo';
    setCandidato(nome);
  }, []);

  if (rotaMidia) {
    return <VisualizarMidia midiaId={rotaMidia.midiaId} eleitorId={rotaMidia.eleitorId} />;
  }

  if (!logado) {
    return <LoginScreen candidato={candidato} onLogin={(p) => { setPerfil(p); setLogado(true); }} />;
  }

  return <Dashboard candidato={candidato} perfil={perfil} onLogout={() => { setLogado(false); setPerfil(null); }} />;
}

export default App;