import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
    <div style={{ minHeight: "100vh", background: "#0a0f1c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#1e293b", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 420, border: "1px solid #334155" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", textAlign: "center", marginBottom: 4 }}>GABINETE DIGITAL SF</h1>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: 28 }}>Deputado Demo 2026</p>
        <form onSubmit={handleLogin}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", background: "white", border: "1px solid #334155", borderRadius: 10, color: "#0f172a", fontSize: 15, boxSizing: "border-box", marginBottom: 12 }}
            placeholder="E-mail" autoFocus required />
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", background: "white", border: "1px solid #334155", borderRadius: 10, color: "#0f172a", fontSize: 15, boxSizing: "border-box", marginBottom: 12 }}
            placeholder="Senha" required />
          {erro && <p style={{ color: "#fca5a5", fontSize: 13, marginBottom: 10 }}>{erro}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "16px", borderRadius: 10, background: "#1d4ed8", color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
        <button onClick={redefinir}
          style={{ width: "100%", padding: 10, marginTop: 10, borderRadius: 10, background: "transparent", color: "#93c5fd", border: "1px solid #334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Criar / redefinir senha
        </button>
      </div>
    </div>
  );
}
