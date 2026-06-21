// src/App.jsx
import { useState, useEffect } from 'react';
import CadastroPublico from './CadastroPublico';
import MidiaTracker from './MidiaTracker';
import LinkTracker from './LinkTracker';
import LoginScreen from './components/LoginScreen';
import DashboardCandidato from './components/DashboardCandidato';
import DashboardEquipe from './components/DashboardEquipe';
import DashboardADM from './components/DashboardADM';
import TelaMaster from './components/TelaMaster';
import TelaBloqueio from './components/TelaBloqueio';
import GestaoUsuarios from './components/GestaoUsuarios';
import { supabase } from './lib/supabase';
import { licencaVencida } from './lib/licenca';
import { registrarLog } from './lib/logAtividade';
import AtualizacaoPWA from './components/AtualizacaoPWA';

function App() {
  const hash = window.location.hash;
  const cadastroMatch = hash.match(/#\/cadastro\/(.+)/);
  const cadastroGenerico = hash === '#/cadastro' || hash === '#/cadastro/';
  const midiaMatch = hash.match(/#\/m\/([^/]+)\/([^/]+)/);
  const linkMatch = hash.match(/#\/r\/([^/]+)\/([^/]+)/);

  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);      // MASTER | CANDIDATO | EQUIPE | ADMIN
  const [membro, setMembro] = useState(null);
  const [licenca, setLicenca] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const [erroConexao, setErroConexao] = useState(false);
  const [iniciando, setIniciando] = useState(true);
  const [verMaster, setVerMaster] = useState(false);
  const [recovery, setRecovery] = useState(hash.includes('type=recovery'));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setIniciando(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao?.user) { setPerfil(null); setMembro(null); setLicenca(null); setCarregado(false); setErroConexao(false); return; }
    let cancelado = false; setErroConexao(false);
    const timeout = setTimeout(() => { if (!cancelado) { setErroConexao(true); setCarregado(true); } }, 10000);
    supabase.from('perfis_usuarios').select('*').eq('user_id', sessao.user.id).maybeSingle()
      .then(({ data }) => { if (!cancelado) { setMembro(data); setPerfil(data?.perfil || 'EQUIPE'); } });
    supabase.from('licenca').select('*').eq('id', 1).maybeSingle()
      .then(({ data, error }) => { if (cancelado) return; clearTimeout(timeout); if (error) setErroConexao(true); setLicenca(data); setCarregado(true); })
      .catch(() => { if (cancelado) return; clearTimeout(timeout); setErroConexao(true); setCarregado(true); });
    return () => { cancelado = true; clearTimeout(timeout); };
  }, [sessao]);

  // Registra "Entrou no sistema" uma vez quando o perfil real carrega
  useEffect(() => {
    if (membro?.user_id && membro.ativo !== false) {
      registrarLog(membro, 'Entrou no sistema', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membro?.user_id]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Rotas públicas (sem login)
  if (cadastroMatch) return <CadastroPublico liderancaId={cadastroMatch[1]} />;
  if (cadastroGenerico) return <CadastroPublico />;
  if (midiaMatch) return <MidiaTracker midiaId={midiaMatch[1]} eleitorId={midiaMatch[2]} />;
  if (linkMatch) return <LinkTracker canal={linkMatch[1]} eleitorId={linkMatch[2]} />;

  if (recovery) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
        <div style={{ background:'white', padding:32, borderRadius:16, maxWidth:360, width:'100%' }}>
          <h2 style={{ marginTop:0, fontSize:18 }}>Defina sua senha</h2>
          <input id="nova" type="password" placeholder="Nova senha" style={{ width:'100%', padding:12, borderRadius:8, border:'2px solid #e2e8f0', boxSizing:'border-box', marginBottom:12 }} />
          <button onClick={async () => { const v = document.getElementById('nova').value; const { error } = await supabase.auth.updateUser({ password: v }); if (!error) { setRecovery(false); window.location.hash = ''; } else alert(error.message); }}
            style={{ width:'100%', padding:12, borderRadius:8, background:'#1e40af', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>Salvar senha</button>
        </div>
      </div>
    );
  }

  if (iniciando) return null;
  if (!sessao) return <LoginScreen />;
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
  if (!perfil || !carregado) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Carregando...</div>;

  if (membro && membro.ativo === false) return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, maxWidth:420, textAlign:'center', boxShadow:'0 25px 50px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Acesso bloqueado</h1>
        <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Seu acesso foi desativado. Fale com o administrador.</p>
        <button onClick={handleLogout} style={{ width:'100%', padding:12, borderRadius:10, background:'#1e40af', color:'#fff', border:'none', fontWeight:700, cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  );

  const ehMaster = perfil === 'MASTER';
  if (licencaVencida(licenca) && !ehMaster) return <TelaBloqueio onLogout={handleLogout} />;
  if (ehMaster && verMaster) return <TelaMaster onVoltar={() => setVerMaster(false)} />;

  const nomeHeader = ehMaster ? 'Master (Andressa)' : perfil === 'CANDIDATO' ? 'Deputado Demo' : perfil === 'ADMIN' ? (membro?.nome || 'ADM') : 'Equipe';
  // Master e Candidato veem o painel completo do candidato. ADMIN vê o DashboardADM. Demais, Equipe.
  const conteudo = (perfil === 'CANDIDATO' || ehMaster)
    ? <DashboardCandidato perfil={membro} ehMaster={ehMaster} />
    : perfil === 'ADMIN'
      ? <DashboardADM adm={membro} perfil={membro} onLogout={handleLogout} />
      : <DashboardEquipe perfil={membro} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AtualizacaoPWA />
      <header className="text-white py-5 shadow-lg" style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(8px, 3vw, 24px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "clamp(10px, 3vw, 24px)", fontWeight: 800, whiteSpace: "nowrap" }}>GABINETE DIGITAL SF</h1>
            <p style={{ color: "#ffffff", fontSize: 13 }}>Deputado Demo</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {ehMaster && (
              <button onClick={() => setVerMaster(true)} style={{ background: "#f59e0b", color: "#0f172a", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                👑 Assinatura
              </button>
            )}
            <span style={{ background: "white", color: "#0f172a", padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
              {nomeHeader}
            </span>
            <button onClick={handleLogout} style={{ background: "#ef4444", color: "white", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(8px, 3vw, 40px) clamp(8px, 3vw, 24px)', width: '100%', boxSizing: 'border-box' }}>
        {conteudo}
      </main>
    </div>
  );
}

export default App;
