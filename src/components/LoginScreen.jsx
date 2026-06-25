import { useState } from 'react';
import { supabase } from '../lib/supabase';
import BotaoTema from './BotaoTema';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !senha) return setErro('Preencha e-mail e senha.');
    setLoading(true); setErro('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('E-mail ou senha incorretos.');
    setLoading(false);
    // O App reage via onAuthStateChange.
  };

  const redefinir = async () => {
    if (!email) return setErro('Digite seu e-mail acima.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setErro(error ? 'Erro ao enviar.' : 'Enviamos um link para definir sua senha.');
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <BotaoTema />
      </div>
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 420, border: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", textAlign: "center", marginBottom: 4 }}>GABINETE DIGITAL SF</h1>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 28 }}>Deputado Demo 2026</p>
        <form onSubmit={handleLogin}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 15, boxSizing: "border-box", marginBottom: 12 }}
            placeholder="E-mail" autoFocus required />
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 15, boxSizing: "border-box", marginBottom: 12 }}
            placeholder="Senha" required />
          {erro && <p style={{ color: "#fca5a5", fontSize: 13, marginBottom: 10 }}>{erro}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "16px", borderRadius: 10, background: "#1d4ed8", color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
        <button onClick={redefinir}
          style={{ width: "100%", padding: 10, marginTop: 10, borderRadius: 10, background: "transparent", color: "#93c5fd", border: "1px solid var(--border)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Criar / redefinir senha
        </button>
      </div>
    </div>
  );
}
