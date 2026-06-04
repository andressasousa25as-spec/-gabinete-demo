import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import VisualizarMidia from './components/VisualizarMidia';
import CadastroPublico from './components/CadastroPublico';

function App() {
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [admLogado, setAdmLogado] = useState(null);
  const [candidato, setCandidato] = useState('');
  const [rotaMidia, setRotaMidia] = useState(null);
  const [rotaCadastro, setRotaCadastro] = useState(null);
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    const matchMidia = hash.match(/^#\/m\/([^/]+)\/([^/]+)/);
    if (matchMidia) { setRotaMidia({ midiaId: matchMidia[1], eleitorId: matchMidia[2] }); setIniciando(false); return; }
    const matchCadastro = hash.match(/^#\/cadastro\/([^/]+)/);
    if (matchCadastro) { setRotaCadastro({ liderancaId: matchCadastro[1] }); setIniciando(false); return; }

    // Restaurar sessão do localStorage
    const savedPerfil = localStorage.getItem('demo_perfil');
    const savedLogado = localStorage.getItem('demo_logado');
    const savedAdm = localStorage.getItem('demo_adm');
    if (savedLogado === 'true' && savedPerfil) {
      setPerfil(savedPerfil);
      setLogado(true);
      if (savedAdm) setAdmLogado(JSON.parse(savedAdm));
    }

    const params = new URLSearchParams(window.location.search);
    setCandidato(params.get('candidato') || 'Candidato Demo');
    setIniciando(false);
  }, []);

  const handleLogin = (p, adm) => {
    setPerfil(p);
    setLogado(true);
    setAdmLogado(adm || null);
    localStorage.setItem('demo_logado', 'true');
    localStorage.setItem('demo_perfil', p);
    if (adm) localStorage.setItem('demo_adm', JSON.stringify(adm));
  };

  const handleLogout = () => {
    setLogado(false);
    setPerfil(null);
    setAdmLogado(null);
    localStorage.removeItem('demo_logado');
    localStorage.removeItem('demo_perfil');
    localStorage.removeItem('demo_adm');
  };

  if (iniciando) return null;
  if (rotaMidia) return <VisualizarMidia midiaId={rotaMidia.midiaId} eleitorId={rotaMidia.eleitorId} />;
  if (rotaCadastro) return <CadastroPublico liderancaId={rotaCadastro.liderancaId} />;
  if (!logado) return <LoginScreen candidato={candidato} onLogin={handleLogin} />;

  return (
    <Dashboard
      candidato={candidato}
      perfil={perfil}
      admLogado={admLogado}
      onLogout={handleLogout}
    />
  );
}

export default App;
