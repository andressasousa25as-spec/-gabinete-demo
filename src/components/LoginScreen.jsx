import { useState } from 'react';

export default function LoginScreen({ candidato, onLogin }) {
  const [perfil, setPerfil] = useState(null);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleLogin = () => {
    const senhaCorreta = perfil === 'candidato' ? 'demo2026' : 'equipe2026';
    if (senha === senhaCorreta) {
      onLogin(perfil);
    } else {
      setErro(`Senha incorreta. Use: ${senhaCorreta}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 40,
        width: 380, boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          GABINETE DIGITAL
        </h1>
        <p style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
          👑 {candidato}
        </p>

        {!perfil ? (
          <>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Selecione seu perfil de acesso:</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <button onClick={() => setPerfil('candidato')} style={{
                flex: 1, padding: '16px 8px', borderRadius: 12, border: '2px solid #1e40af',
                background: '#eff6ff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1e40af',
              }}>
                👑<br/>Candidato
              </button>
              <button onClick={() => setPerfil('equipe')} style={{
                flex: 1, padding: '16px 8px', borderRadius: 12, border: '2px solid #7c3aed',
                background: '#f5f3ff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#7c3aed',
              }}>
                👥<br/>Equipe
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }} onClick={() => { setPerfil(null); setSenha(''); setErro(''); }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>← Voltar</span>
            </div>
            <div style={{ background: perfil === 'candidato' ? '#eff6ff' : '#f5f3ff', borderRadius: 10, padding: '10px', marginBottom: 16 }}>
              <p style={{ margin: 0, fontWeight: 700, color: perfil === 'candidato' ? '#1e40af' : '#7c3aed', fontSize: 14 }}>
                {perfil === 'candidato' ? '👑 Acesso Candidato' : '👥 Acesso Equipe'}
              </p>
            </div>
            <input
              type="password"
              placeholder="Senha de acesso"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                border: '2px solid #e2e8f0', fontSize: 15, marginBottom: 12,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{erro}</p>}
            <button onClick={handleLogin} style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: perfil === 'candidato' ? '#1e40af' : '#7c3aed',
              color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              Acessar Sistema
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
