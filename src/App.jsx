import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import VisualizarMidia from './components/VisualizarMidia';
import CadastroPublico from './components/CadastroPublico';

function App() {
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [candidato, setCandidato] = useState('');
  const [rotaMidia, setRotaMidia] = useState(null);
  const [rotaCadastro, setRotaCadastro] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    const matchMidia = hash.match(/^#\/m\/([^/]+)\/([^/]+)/);
    if (matchMidia) { setRotaMidia({ midiaId: matchMidia[1], eleitorId: matchMidia[2] }); return; }
    const matchCadastro = hash.match(/^#\/cadastro\/([^/]+)/);
    if (matchCadastro) { setRotaCadastro({ liderancaId: matchCadastro[1] }); return; }
    const params = new URLSearchParams(window.location.search);
    const nome = params.get('candidato') || 'Candidato Demo';
    setCandidato(nome);
  }, []);

  if (rotaMidia) return <VisualizarMidia midiaId={rotaMidia.midiaId} eleitorId={rotaMidia.eleitorId} />;
  if (rotaCadastro) return <CadastroPublico liderancaId={rotaCadastro.liderancaId} />;
  if (!logado) return <LoginScreen candidato={candidato} onLogin={(p) => { setPerfil(p); setLogado(true); }} />;
  return <Dashboard candidato={candidato} perfil={perfil} onLogout={() => { setLogado(false); setPerfil(null); }} />;
}

export default App;