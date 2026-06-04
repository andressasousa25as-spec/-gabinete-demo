import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ candidato, onLogin }) {
  const [perfil, setPerfil] = useState(null);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!senha) return setErro('Digite a senha.');
    setLoading(true);
    setErro('');

    if (perfil === 'candidato') {
      if (senha === 'demo2026') { onLogin('candidato', null); }
      else setErro('Senha incorreta.');

    } else if (perfil === 'equipe') {
      if (senha === 'equipe2026') { onLogin('equipe', null); }
      else setErro('Senha incorreta.');

    } else if (perfil === 'adm') {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('senha', senha)
        .eq('ativo', true)
        .maybeSingle();
      if (error || !data) setErro('Senha incorreta ou ADM inativo.');
      else onLogin('adm', data);
    }
    setLoading(false);
  };

  const perfis = [
    { key: 'candidato', label: 'Candidato', icon: '👑', cor: '#1e40af', bg: '#eff6ff', border: '#1e40af' },
    { key: 'adm',       label: 'ADM',       icon: '👮', cor: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed' },
    { key: 'equipe',    label: 'Equipe',    icon: '👥', cor: '#059669', bg: '#f0fdf4', border: '#059669' },
  ];

  const perfilAtual = perfis.find(p => p.key === perfil);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 40,
        width: '100%', maxWidth: 400,
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          GABINETE DIGITAL
        </h1>
        <p style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
          👑 {candidato || 'Candidato Demo'}
        </p>

        {!perfil ? (
          <>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Selecione seu perfil de acesso:</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {perfis.map(p => (
                <button key={p.key} onClick={() => setPerfil(p.key)} style={{
                  flex: 1, padding: '16px 8px', borderRadius: 12,
                  border: `2px solid ${p.border}`,
                  background: p.bg, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: p.cor,
                }}>
                  {p.icon}<br />{p.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}
              onClick={() => { setPerfil(null); setSenha(''); setErro(''); }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>← Voltar</span>
            </div>
            <div style={{ background: perfilAtual.bg, borderRadius: 10, padding: 10, marginBottom: 16 }}>
              <p style={{ margin: 0, fontWeight: 700, color: perfilAtual.cor, fontSize: 14 }}>
                {perfilAtual.icon} Acesso {perfilAtual.label}
              </p>
            </div>
            <input
              type="password"
              placeholder="Senha de acesso"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                border: '2px solid #e2e8f0', fontSize: 15, marginBottom: 12,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{erro}</p>}
            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: 13, borderRadius: 10,
              background: perfilAtual.cor,
              color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? 'Verificando...' : 'Acessar Sistema'}
            </button>
          </>
        )}
        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 16 }}>
          Sistema de Gestão Eleitoral 2026
        </p>
      </div>
    </div>
  );
}
