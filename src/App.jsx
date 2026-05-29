import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';

function App() {
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [candidato, setCandidato] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get('candidato') || 'Candidato Demo';
    setCandidato(nome);
  }, []);

  if (!logado) {
    return <LoginScreen candidato={candidato} onLogin={(p) => { setPerfil(p); setLogado(true); }} />;
  }

  return <Dashboard candidato={candidato} perfil={perfil} onLogout={() => { setLogado(false); setPerfil(null); }} />;
}

export default App;
