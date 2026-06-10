import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ candidato }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return setErro('Preencha e-mail e senha.');
    setLoading(true); setErro('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('E-mail ou senha incorretos.');
    setLoading(false);
    // O App reage via onAuthStateChange; nada mais a fazer aqui.
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>GABINETE DIGITAL</h1>
        <p style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>👑 {candidato || 'Candidato Demo'}</p>
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
        <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
        {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{erro}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: 13, borderRadius: 10, background: '#1e40af', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Sistema de Gestão Eleitoral 2026</p>
      </div>
    </div>
  );
}
