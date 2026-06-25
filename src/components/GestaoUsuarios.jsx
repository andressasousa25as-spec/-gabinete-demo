import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { papelFixo } from '../lib/papeis';

export default function GestaoUsuarios({ perfil, onVoltar }) {
  const [aba, setAba] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filtroPor, setFiltroPor] = useState('');
  const [novo, setNovo] = useState({ nome: '', email: '', perfil: 'EQUIPE' });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => { carregarUsuarios(); carregarLogs(); }, []);

  const carregarUsuarios = async () => {
    const { data } = await supabase.from('perfis_usuarios').select('*').order('perfil');
    if (data) setUsuarios(data);
  };
  const carregarLogs = async () => {
    const { data } = await supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(200);
    if (data) setLogs(data);
  };

  const chamar = async (body) => {
    const { data, error } = await supabase.functions.invoke('gerir-usuarios', { body });
    if (error) return { error: error.message };
    return data || {};
  };

  const convidar = async () => {
    if (!novo.nome || !novo.email) return alert('Nome e e-mail obrigatórios.');
    setLoading(true);
    const r = await chamar({ action: 'convidar', email: novo.email, nome: novo.nome, perfil: novo.perfil, redirectTo: window.location.origin });
    setLoading(false);
    if (r.error) return alert('⚠️ ' + r.error);
    alert('✅ Convite enviado para ' + novo.email);
    setNovo({ nome: '', email: '', perfil: 'EQUIPE' });
    carregarUsuarios();
  };

  const alternarBloqueio = async (u) => {
    const acao = u.ativo ? 'bloquear' : 'reativar';
    if (!confirm(u.ativo ? `Bloquear ${u.nome}?` : `Reativar ${u.nome}?`)) return;
    const r = await chamar({ action: acao, user_id: u.user_id });
    if (r.error) return alert('⚠️ ' + r.error);
    carregarUsuarios();
  };

  const salvarEdicao = async () => {
    const r = await chamar({ action: 'editar', user_id: editando.user_id, nome: editando.nome, perfil: editando.perfil });
    if (r.error) return alert('⚠️ ' + r.error);
    setEditando(null);
    carregarUsuarios();
  };

  const logsFiltrados = filtroPor ? logs.filter(l => l.adm_nome === filtroPor) : logs;
  const nomes = [...new Set(logs.map(l => l.adm_nome))].sort();
  const card = { background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', marginBottom: 16 };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 60px' }}>
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, margin: 0 }}>Gestão de Usuários</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>Logins reais e relatório de atividades</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ key: 'usuarios', label: `👥 Usuários (${usuarios.length})` }, { key: 'logs', label: `📋 Relatório (${logs.length})` }].map(a => (
            <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: aba === a.key ? '#1d4ed8' : 'var(--surface)', color: aba === a.key ? '#fff' : 'var(--text-muted)' }}>{a.label}</button>
          ))}
        </div>

        {aba === 'usuarios' && (
          <>
            <div style={{ ...card }}>
              <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>➕ Convidar Usuário</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nome *</label>
                  <input value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} placeholder="Ex: Maria Silva" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>E-mail *</label>
                  <input value={novo.email} onChange={e => setNovo({ ...novo, email: e.target.value })} placeholder="email@exemplo.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Papel *</label>
                  <select value={novo.perfil} onChange={e => setNovo({ ...novo, perfil: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="EQUIPE">Equipe</option>
                    <option value="ADMIN">ADM</option>
                  </select>
                </div>
                <button onClick={convidar} disabled={loading} style={{ padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {loading ? 'Enviando...' : 'Convidar'}
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '10px 0 0' }}>O convite é enviado por e-mail. Requer o e-mail (SMTP) configurado.</p>
            </div>

            <div style={{ ...card }}>
              <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>👥 Usuários</p>
              {usuarios.map(u => (
                <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--surface-2)', flexWrap: 'wrap' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.ativo ? '#dbeafe' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: u.ativo ? '#1d4ed8' : 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>
                    {(u.nome || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: 14 }}>{u.nome} <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>· {u.perfil}</span></p>
                    {u.email && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>✉️ {u.email}</p>}
                  </div>
                  <span style={{ background: u.ativo ? '#dcfce7' : '#fee2e2', color: u.ativo ? '#16a34a' : '#dc2626', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{u.ativo ? 'Ativo' : 'Bloqueado'}</span>
                  {papelFixo(u.perfil) ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, padding: '6px 12px' }}>🔒 Fixo</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditando({ ...u })} style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✏️</button>
                      <button onClick={() => alternarBloqueio(u)} style={{ background: u.ativo ? '#fef9c3' : '#dcfce7', color: u.ativo ? '#854d0e' : '#16a34a', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        {u.ativo ? 'Bloquear' : 'Reativar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {aba === 'logs' && (
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: 0 }}>📋 Relatório de Atividades</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={filtroPor} onChange={e => setFiltroPor(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                  <option value="">Todos os usuários</option>
                  {nomes.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={() => {
                  const rows = logsFiltrados.map(l => `${new Date(l.created_at).toLocaleString('pt-BR')} | ${l.adm_nome} | ${l.acao} | ${l.detalhes || ''}`).join('\n');
                  const blob = new Blob([`RELATÓRIO DE ATIVIDADES - GABINETE PAULINHO RAMOS\n\n${rows}`], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'relatorio-usuarios.txt'; a.click();
                }} style={{ padding: '8px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>⬇️ Exportar</button>
              </div>
            </div>
            {logsFiltrados.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhuma atividade registrada.</p> :
              logsFiltrados.map(l => (
                <div key={l.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--surface-2)', alignItems: 'flex-start' }}>
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#1d4ed8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleDateString('pt-BR')}<br />
                    <span style={{ fontWeight: 400 }}>{new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, margin: '0 0 2px' }}>{l.adm_nome}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 2px' }}>{l.acao}</p>
                    {l.detalhes && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{l.detalhes}</p>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480 }}>
            <h2 style={{ color: '#1d4ed8', margin: '0 0 20px', fontSize: 18, fontWeight: 800 }}>✏️ Editar Usuário</h2>
            <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nome</label>
            <input value={editando.nome || ''} onChange={e => setEditando({ ...editando, nome: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }} />
            <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Papel</label>
            <select value={editando.perfil} onChange={e => setEditando({ ...editando, perfil: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 20, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }}>
              <option value="EQUIPE">Equipe</option>
              <option value="ADMIN">ADM</option>
            </select>
            <button onClick={salvarEdicao} style={{ width: '100%', padding: 14, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}>✅ Salvar</button>
            <button onClick={() => setEditando(null)} style={{ width: '100%', padding: 12, background: 'var(--surface-2)', color: 'var(--text-muted)', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
