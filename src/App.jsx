import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import VisualizarMidia from './components/VisualizarMidia';
import CadastroPublico from './components/CadastroPublico';
import { supabase } from './lib/supabase';
import TelaBloqueio from './components/TelaBloqueio';
import { licencaVencida } from './lib/licenca';

function App() {
  const [sessao, setSessao] = useState(null);
  const [papel, setPapel] = useState(null);
  const [membro, setMembro] = useState(null);
  const [candidato, setCandidato] = useState('');
  const [rotaMidia, setRotaMidia] = useState(null);
  const [rotaCadastro, setRotaCadastro] = useState(null);
  const [iniciando, setIniciando] = useState(true);
  const [licenca, setLicenca] = useState(null);
  const [licencaCarregada, setLicencaCarregada] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const matchMidia = hash.match(/^#\/m\/([^/]+)\/([^/]+)/);
    if (matchMidia) { setRotaMidia({ midiaId: matchMidia[1], eleitorId: matchMidia[2] }); setIniciando(false); return; }
    const matchCadastro = hash.match(/^#\/cadastro\/([^/]+)/);
    if (matchCadastro) { setRotaCadastro({ liderancaId: matchCadastro[1] }); setIniciando(false); return; }

    const params = new URLSearchParams(window.location.search);
    setCandidato(params.get('candidato') || 'Candidato Demo');

    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setIniciando(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao?.user) { setPapel(null); setMembro(null); setLicenca(null); setLicencaCarregada(false); return; }
    supabase.from('membros').select('*').eq('user_id', sessao.user.id).maybeSingle()
      .then(({ data }) => { setMembro(data); setPapel(data?.papel || 'equipe'); });
    supabase.from('licenca').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { setLicenca(data); setLicencaCarregada(true); });
  }, [sessao]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (iniciando) return null;
  if (rotaMidia) return <VisualizarMidia midiaId={rotaMidia.midiaId} eleitorId={rotaMidia.eleitorId} />;
  if (rotaCadastro) return <CadastroPublico liderancaId={rotaCadastro.liderancaId} />;
  if (!sessao) return <LoginScreen candidato={candidato} />;
  if (!papel || !licencaCarregada) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Carregando...</div>;

  const ehMaster = papel === 'master';
  if (licencaVencida(licenca) && !ehMaster) return <TelaBloqueio onLogout={handleLogout} />;

  return (
    <Dashboard
      candidato={candidato}
      perfil={papel}
      admLogado={papel === 'adm' ? membro : null}
      onLogout={handleLogout}
    />
  );
}

export default App;
