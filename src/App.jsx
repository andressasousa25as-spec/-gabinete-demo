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
  const [erroConexao, setErroConexao] = useState(false);
  const [recovery, setRecovery] = useState(window.location.hash.includes('type=recovery'));

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
    if (!sessao?.user) { setPapel(null); setMembro(null); setLicenca(null); setLicencaCarregada(false); setErroConexao(false); return; }
    let cancelado = false;
    setErroConexao(false);
    // Se o banco não responder em 10s, sai do "Carregando" com erro em vez de travar.
    const timeout = setTimeout(() => { if (!cancelado) { setErroConexao(true); setLicencaCarregada(true); } }, 10000);
    supabase.from('membros').select('*').eq('user_id', sessao.user.id).maybeSingle()
      .then(({ data }) => { if (!cancelado) { setMembro(data); setPapel(data?.papel || 'equipe'); } });
    supabase.from('licenca').select('*').eq('id', 1).maybeSingle()
      .then(({ data, error }) => { if (cancelado) return; clearTimeout(timeout); if (error) setErroConexao(true); setLicenca(data); setLicencaCarregada(true); })
      .catch(() => { if (cancelado) return; clearTimeout(timeout); setErroConexao(true); setLicencaCarregada(true); });
    return () => { cancelado = true; clearTimeout(timeout); };
  }, [sessao]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (iniciando) return null;
  if (rotaMidia) return <VisualizarMidia midiaId={rotaMidia.midiaId} eleitorId={rotaMidia.eleitorId} />;
  if (rotaCadastro) return <CadastroPublico liderancaId={rotaCadastro.liderancaId} />;
  if (recovery) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
        <div style={{background:'white',padding:32,borderRadius:16,maxWidth:360,width:'100%'}}>
          <h2 style={{marginTop:0,fontSize:18}}>Defina sua senha</h2>
          <input id="nova" type="password" placeholder="Nova senha" style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #e2e8f0',boxSizing:'border-box',marginBottom:12}} />
          <button onClick={async()=>{ const v=document.getElementById('nova').value; const {error}=await supabase.auth.updateUser({password:v}); if(!error){ setRecovery(false); window.location.hash=''; } else alert(error.message); }}
            style={{width:'100%',padding:12,borderRadius:8,background:'#1e40af',color:'white',border:'none',fontWeight:700,cursor:'pointer'}}>Salvar senha</button>
        </div>
      </div>
    );
  }
  if (!sessao) return <LoginScreen candidato={candidato} />;
  if (erroConexao) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:420, textAlign:'center', boxShadow:'0 25px 50px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📡</div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Erro de conexão</h1>
        <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Não foi possível falar com o servidor. Verifique sua internet (ou se a rede/firewall bloqueia o acesso) e tente de novo.</p>
        <button onClick={() => window.location.reload()} style={{ width:'100%', padding:13, borderRadius:10, background:'#1e40af', color:'white', border:'none', fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:10 }}>Tentar novamente</button>
        <button onClick={handleLogout} style={{ width:'100%', padding:11, borderRadius:10, background:'#f1f5f9', color:'#64748b', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  );
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
