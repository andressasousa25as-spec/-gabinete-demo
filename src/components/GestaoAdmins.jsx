import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function GestaoAdmins({ onVoltar }) {
  // Tela já protegida pelo login (só master/candidato chega aqui). Sem senha extra.
  const [autenticado] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aba, setAba] = useState('admins');
  const [novoAdm, setNovoAdm] = useState({ nome: '', telefone: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [filtroPor, setFiltroPor] = useState('');
  const [admEditando, setAdmEditando] = useState(null);

  useEffect(() => {
    if (autenticado) { carregarAdmins(); carregarLogs(); }
  }, [autenticado]);

  const carregarAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
    if (data) setAdmins(data);
  };

  const carregarLogs = async () => {
    const { data } = await supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(200);
    if (data) setLogs(data);
  };

  const cadastrarAdm = async () => {
    if (!novoAdm.nome || !novoAdm.senha) return alert('Nome e senha obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('admins').insert([novoAdm]);
    if (!error) { alert('✅ ADM cadastrado!'); setNovoAdm({ nome: '', telefone: '', senha: '' }); carregarAdmins(); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const desativarAdm = async (id, ativo) => {
    if (!confirm(ativo ? 'Desativar este ADM?' : 'Reativar este ADM?')) return;
    await supabase.from('admins').update({ ativo: !ativo }).eq('id', id);
    carregarAdmins();
  };

  const excluirAdm = async (id, nome) => {
    if (!confirm(`Excluir permanentemente o ADM "${nome}"?\nOs logs também serão removidos.`)) return;
    await supabase.from('logs_atividades').delete().eq('adm_id', id);
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (!error) { alert('✅ ADM excluído!'); carregarAdmins(); carregarLogs(); }
    else alert('Erro: ' + error.message);
  };

  const salvarEdicaoAdm = async () => {
    if (!admEditando.nome || !admEditando.senha) return alert('Nome e senha obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('admins').update({
      nome: admEditando.nome, telefone: admEditando.telefone || '', senha: admEditando.senha,
    }).eq('id', admEditando.id);
    if (!error) { alert('✅ ADM atualizado!'); setAdmEditando(null); carregarAdmins(); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const logsFiltrados = filtroPor ? logs.filter(l => l.adm_nome === filtroPor) : logs;
  const admNomes = [...new Set(logs.map(l => l.adm_nome))].sort();
  const card = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginBottom: 16 };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 60px' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 }}>Gestão de Administradores</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>Cadastro de ADMs e relatório de atividades</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ key: 'admins', label: `👥 ADMs (${admins.length})` }, { key: 'logs', label: `📋 Relatório (${logs.length})` }].map(a => (
            <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: aba === a.key ? '#1d4ed8' : '#1e293b', color: aba === a.key ? '#fff' : '#94a3b8' }}>{a.label}</button>
          ))}
        </div>

        {aba === 'admins' && (
          <>
            <div style={{ ...card }}>
              <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>➕ Cadastrar Novo ADM</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
                {[{ label: 'Nome *', key: 'nome', ph: 'Ex: Maria Silva' }, { label: 'Telefone', key: 'telefone', ph: '(96) 9xxxx-xxxx' }, { label: 'Senha *', key: 'senha', ph: 'Senha de acesso' }].map(f => (
                  <div key={f.key}>
                    <label style={{ color: '#475569', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input value={novoAdm[f.key]} onChange={e => setNovoAdm({ ...novoAdm, [f.key]: e.target.value })} placeholder={f.ph}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <button onClick={cadastrarAdm} disabled={loading} style={{ padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </div>

            <div style={{ ...card }}>
              <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>👥 ADMs Cadastrados</p>
              {admins.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Nenhum ADM.</p> :
                admins.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: a.ativo ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: a.ativo ? '#1d4ed8' : '#94a3b8', fontSize: 16, flexShrink: 0 }}>
                      {a.nome[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: 14 }}>{a.nome}</p>
                      {a.telefone && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>📱 {a.telefone}</p>}
                      <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>Cadastrado em {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span style={{ background: a.ativo ? '#dcfce7' : '#fee2e2', color: a.ativo ? '#16a34a' : '#dc2626', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{a.ativo ? 'Ativo' : 'Inativo'}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setAdmEditando({ ...a })} style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✏️</button>
                      <button onClick={() => desativarAdm(a.id, a.ativo)} style={{ background: a.ativo ? '#fef9c3' : '#dcfce7', color: a.ativo ? '#854d0e' : '#16a34a', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        {a.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                      <button onClick={() => excluirAdm(a.id, a.nome)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🗑️</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {aba === 'logs' && (
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, margin: 0 }}>📋 Relatório de Atividades</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select value={filtroPor} onChange={e => setFiltroPor(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <option value="">Todos os ADMs</option>
                  {admNomes.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={() => {
                  const rows = logsFiltrados.map(l => `${new Date(l.created_at).toLocaleString('pt-BR')} | ${l.adm_nome} | ${l.acao} | ${l.detalhes || ''}`).join('\n');
                  const blob = new Blob([`RELATÓRIO DE ATIVIDADES\n\n${rows}`], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'relatorio-admins.txt'; a.click();
                }} style={{ padding: '8px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>⬇️ Exportar</button>
              </div>
            </div>
            {logsFiltrados.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Nenhuma atividade.</p> :
              logsFiltrados.map(l => (
                <div key={l.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#1d4ed8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleDateString('pt-BR')}<br />
                    <span style={{ fontWeight: 400 }}>{new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, margin: '0 0 2px' }}>{l.adm_nome}</p>
                    <p style={{ color: '#475569', fontSize: 13, margin: '0 0 2px' }}>{l.acao}</p>
                    {l.detalhes && <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{l.detalhes}</p>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {admEditando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.target === e.currentTarget && setAdmEditando(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#1d4ed8', margin: '0 0 20px', fontSize: 18, fontWeight: 800 }}>✏️ Editar ADM</h2>
            {[{ label: 'Nome *', key: 'nome', ph: 'Nome completo' }, { label: 'Telefone', key: 'telefone', ph: '(96) 9xxxx-xxxx' }, { label: 'Nova Senha *', key: 'senha', ph: 'Digite a nova senha' }].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ color: '#475569', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input value={admEditando[f.key] || ''} onChange={e => setAdmEditando({ ...admEditando, [f.key]: e.target.value })}
                  placeholder={f.ph} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <button onClick={salvarEdicaoAdm} disabled={loading} style={{ width: '100%', padding: 14, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}>
              {loading ? 'Salvando...' : '✅ Salvar Alterações'}
            </button>
            <button onClick={() => setAdmEditando(null)} style={{ width: '100%', padding: 12, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
