import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MapaDemo from './MapaDemo';
import CenarioPolitico from './CenarioPolitico';
import RankingEngajamento from './RankingEngajamento';
import AnalyticsMidias from './AnalyticsMidias';
import GestaoMidias from './GestaoMidias';

const MAPBOX_TOKEN = 'import.meta.env.VITE_MAPBOX_TOKEN';

export default function Dashboard({ candidato, perfil, onLogout }) {
  const [aba, setAba] = useState('inicio');
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(candidato);
  const [nomeAtual, setNomeAtual] = useState(candidato);
  const [foto, setFoto] = useState(null);
  const fotoInput = useRef(null);

  const [eleitores, setEleitores] = useState([]);
  const [liderancas, setLiderancas] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showEleitor, setShowEleitor] = useState(false);
  const [showLider, setShowLider] = useState(false);
  const [showReuniao, setShowReuniao] = useState(false);
  const [showAnotacao, setShowAnotacao] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);

  const [novoEleitor, setNovoEleitor] = useState({ nome: '', telefone: '', bairro: '', logradouro: '', zona_eleitoral: '', secao_eleitoral: '', cidade: 'Macapá' });
  const [novaLider, setNovaLider] = useState({ nome: '', telefone: '', bairro: '', demanda: '' });
  const [novaReuniao, setNovaReuniao] = useState({ titulo: '', data: '', local: '', endereco: '' });
  const [novaAnotacao, setNovaAnotacao] = useState({ titulo: '', conteudo: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [e, l, r, a] = await Promise.all([
      supabase.from('eleitores').select('*').order('created_at', { ascending: false }),
      supabase.from('liderancas').select('*').order('created_at', { ascending: false }),
      supabase.from('reunioes').select('*').order('data', { ascending: false }),
      supabase.from('anotacoes').select('*').order('created_at', { ascending: false }),
    ]);
    if (e.data) setEleitores(e.data);
    if (l.data) setLiderancas(l.data);
    if (r.data) setReunioes(r.data);
    if (a.data) setAnotacoes(a.data);
  };

  const cadastrarEleitor = async () => {
    if (!termoAceito) return alert('Aceite o termo LGPD para continuar.');
    if (!novoEleitor.nome || !novoEleitor.telefone) return alert('Nome e telefone são obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('eleitores').insert([{ ...novoEleitor, consentimento_lgpd: true }]);
    if (!error) { alert('Eleitor cadastrado!'); fetchAll(); setShowEleitor(false); setTermoAceito(false); setNovoEleitor({ nome: '', telefone: '', bairro: '', logradouro: '', zona_eleitoral: '', secao_eleitoral: '', cidade: 'Macapá' }); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const cadastrarLider = async () => {
    if (!novaLider.nome) return alert('Nome é obrigatório.');
    setLoading(true);
    const { error } = await supabase.from('liderancas').insert([novaLider]);
    if (!error) { alert('Liderança salva!'); fetchAll(); setShowLider(false); setNovaLider({ nome: '', telefone: '', bairro: '', demanda: '' }); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const cadastrarReuniao = async () => {
    if (!novaReuniao.titulo || !novaReuniao.data) return alert('Título e data são obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('reunioes').insert([novaReuniao]);
    if (!error) { alert('Reunião agendada!'); fetchAll(); setShowReuniao(false); setNovaReuniao({ titulo: '', data: '', local: '', endereco: '' }); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const cadastrarAnotacao = async () => {
    if (!novaAnotacao.titulo) return alert('Título é obrigatório.');
    setLoading(true);
    const { error } = await supabase.from('anotacoes').insert([novaAnotacao]);
    if (!error) { alert('Anotação salva!'); fetchAll(); setShowAnotacao(false); setNovaAnotacao({ titulo: '', conteudo: '' }); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const excluir = async (tabela, id) => {
    if (!confirm('Excluir permanentemente?')) return;
    await supabase.from(tabela).delete().eq('id', id);
    fetchAll();
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const estiloModal = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const estiloCard = { background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' };
  const estiloInput = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' };
  const estiloBotao = (cor) => ({ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: cor, color: 'white', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginTop: 8 });

  // Abas por perfil
  const abasCandidato = [
    { id: 'inicio', label: '🏠 Início' },
    { id: 'eleitores', label: '👥 Eleitores' },
    { id: 'liderancas', label: '🤝 Lideranças' },
    { id: 'reunioes', label: '📅 Reuniões' },
    { id: 'mapa', label: '🗺️ Mapa' },
    { id: 'anotacoes', label: '📝 Anotações' },
    { id: 'midias', label: '📱 Mídias' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'ranking', label: '🏆 Ranking' },
    { id: 'cenario', label: '📈 Cenário' },
  ];

  const abasEquipe = [
    { id: 'inicio', label: '🏠 Início' },
    { id: 'eleitores', label: '👥 Eleitores' },
    { id: 'reunioes', label: '📅 Reuniões' },
    { id: 'mapa', label: '🗺️ Mapa' },
    { id: 'anotacoes', label: '📝 Anotações' },
  ];

  const abas = perfil === 'candidato' ? abasCandidato : abasEquipe;

  const card = (titulo, valor, sub, cor) => (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: `1px solid ${cor}33` }}>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>{titulo}</p>
      <p style={{ color: cor, fontSize: 32, fontWeight: 800 }}>{valor}</p>
      <p style={{ color: '#64748b', fontSize: 12 }}>{sub}</p>
    </div>
  );

  // Telas especiais
  if (aba === 'cenario') return <div style={{ background: '#f8fafc', minHeight: '100vh', padding: 24 }}><button onClick={() => setAba('inicio')} style={{ marginBottom: 20, padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button><CenarioPolitico /></div>;
  if (aba === 'ranking') return <div style={{ background: '#0f172a', minHeight: '100vh' }}><RankingEngajamento onVoltar={() => setAba('inicio')} /></div>;
  if (aba === 'analytics') return <div style={{ background: '#f8fafc', minHeight: '100vh' }}><AnalyticsMidias onVoltar={() => setAba('inicio')} /></div>;
  if (aba === 'midias') return <div style={{ background: '#0f172a', minHeight: '100vh' }}><GestaoMidias onVoltar={() => setAba('inicio')} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      {/* Header */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={() => perfil === 'candidato' && fotoInput.current.click()}
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#1e293b', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: perfil === 'candidato' ? 'pointer' : 'default', overflow: 'hidden', flexShrink: 0 }}
            title={perfil === 'candidato' ? 'Clique para adicionar foto' : ''}>
            {foto ? <img src={foto} alt="candidato" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>👤</span>}
          </div>
          {perfil === 'candidato' && <input ref={fotoInput} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>GABINETE DIGITAL</h1>
            {editandoNome && perfil === 'candidato' ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <input value={nomeEdit} onChange={e => setNomeEdit(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #3b82f6', background: '#1e293b', color: 'white', fontSize: 13 }} />
                <button onClick={() => { setNomeAtual(nomeEdit); setEditandoNome(false); }} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setEditandoNome(false)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>✗</button>
              </div>
            ) : (
              <p style={{ color: '#60a5fa', fontSize: 14, margin: '2px 0 0', cursor: perfil === 'candidato' ? 'pointer' : 'default' }} onClick={() => perfil === 'candidato' && setEditandoNome(true)}>
                👑 {nomeAtual} {perfil === 'candidato' && <span style={{ fontSize: 11, color: '#64748b' }}>✏️</span>}
              </p>
            )}
            <span style={{ fontSize: 11, color: perfil === 'candidato' ? '#f59e0b' : '#a78bfa', fontWeight: 600 }}>{perfil === 'candidato' ? '👑 Candidato' : '👥 Equipe'}</span>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Sair</button>
      </header>

      {/* Navegação */}
      <nav style={{ background: '#1e293b', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: '14px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', background: aba === a.id ? '#0f172a' : 'transparent', color: aba === a.id ? '#60a5fa' : '#94a3b8', borderBottom: aba === a.id ? '2px solid #3b82f6' : '2px solid transparent' }}>{a.label}</button>
        ))}
      </nav>

      {/* Conteúdo */}
      <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* Botões de ação */}
        {(aba === 'inicio' || aba === 'eleitores') && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setShowEleitor(true)} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>+ Eleitor</button>
            {perfil === 'candidato' && <button onClick={() => setShowLider(true)} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>+ Liderança</button>}
            <button onClick={() => setShowReuniao(true)} style={{ background: '#d97706', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>+ Reunião</button>
          </div>
        )}

        {/* INÍCIO */}
        {aba === 'inicio' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'center' }}>
              <h2 style={{ fontSize: 28, margin: 0 }}>👑 {nomeAtual}</h2>
              <p style={{ color: '#93c5fd', margin: '8px 0 0' }}>Meta: <strong>7.000 votos</strong> • Eleitores: {eleitores.length} • Lideranças: {liderancas.length}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {card('Total de Eleitores', eleitores.length, 'Meta: 50.000', '#60a5fa')}
              {card('Lideranças Ativas', liderancas.length, 'Meta: 200', '#f59e0b')}
              {card('Reuniões', reunioes.length, 'agendadas e realizadas', '#34d399')}
              {card('Anotações', anotacoes.length, 'registradas', '#a78bfa')}
            </div>
            <h3 style={{ fontSize: 16, color: '#94a3b8', marginBottom: 12 }}>📅 Próximas Reuniões</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reunioes.slice(0, 3).map(r => (
                <div key={r.id} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{r.titulo}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>📍 {r.local}</p>
                  </div>
                  <span style={{ background: '#1e40af', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                    {r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ELEITORES */}
        {aba === 'eleitores' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>👥 Eleitores ({eleitores.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eleitores.map(e => (
                <div key={e.id} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{e.nome}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '2px 0 0' }}>📍 {e.bairro || '-'} • Zona {e.zona_eleitoral || '-'} Seção {e.secao_eleitoral || '-'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {e.telefone && <a href={`https://wa.me/55${e.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ background: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>📲</a>}
                    {perfil === 'candidato' && <button onClick={() => excluir('eleitores', e.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🗑️</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIDERANÇAS */}
        {aba === 'liderancas' && perfil === 'candidato' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>🤝 Lideranças ({liderancas.length})</h2>
              <button onClick={() => setShowLider(true)} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>+ Liderança</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {liderancas.map(l => (
                <div key={l.id} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #dc262633' }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#f87171', margin: '0 0 8px' }}>🔴 {l.nome}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0' }}>📍 {l.bairro || '-'}</p>
                  {l.demanda && <p style={{ color: '#fbbf24', fontSize: 13, margin: '8px 0 0' }}>💬 {l.demanda}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {l.telefone && <a href={`https://wa.me/55${l.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ background: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>📲</a>}
                    <button onClick={() => excluir('liderancas', l.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REUNIÕES */}
        {aba === 'reunioes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>📅 Reuniões ({reunioes.length})</h2>
              <button onClick={() => setShowReuniao(true)} style={{ background: '#d97706', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>+ Reunião</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reunioes.map(r => (
                <div key={r.id} style={{ background: '#1e293b', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{r.titulo}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>📍 {r.local} • {r.data ? new Date(r.data).toLocaleString('pt-BR') : '-'}</p>
                  </div>
                  {perfil === 'candidato' && <button onClick={() => excluir('reunioes', r.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>🗑️</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAPA */}
        {aba === 'mapa' && <MapaDemo token={MAPBOX_TOKEN} candidato={nomeAtual} />}

        {/* ANOTAÇÕES */}
        {aba === 'anotacoes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>📝 Anotações ({anotacoes.length})</h2>
              <button onClick={() => setShowAnotacao(true)} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>+ Anotação</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {anotacoes.map(a => (
                <div key={a.id} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                  <p style={{ fontWeight: 700, color: '#60a5fa', margin: '0 0 8px' }}>📌 {a.titulo}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{a.conteudo}</p>
                  <p style={{ color: '#475569', fontSize: 11, margin: '8px 0 0' }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                  {perfil === 'candidato' && <button onClick={() => excluir('anotacoes', a.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginTop: 8 }}>🗑️</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL ELEITOR */}
      {showEleitor && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowEleitor(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#16a34a', marginBottom: 20 }}>➕ Cadastrar Eleitor</h2>
            <input style={estiloInput} placeholder="Nome completo *" value={novoEleitor.nome} onChange={e => setNovoEleitor({...novoEleitor, nome: e.target.value})} />
            <input style={estiloInput} placeholder="Telefone / WhatsApp *" value={novoEleitor.telefone} onChange={e => setNovoEleitor({...novoEleitor, telefone: e.target.value})} />
            <input style={estiloInput} placeholder="Bairro" value={novoEleitor.bairro} onChange={e => setNovoEleitor({...novoEleitor, bairro: e.target.value})} />
            <input style={estiloInput} placeholder="Endereço" value={novoEleitor.logradouro} onChange={e => setNovoEleitor({...novoEleitor, logradouro: e.target.value})} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{...estiloInput, flex: 1}} placeholder="Zona" value={novoEleitor.zona_eleitoral} onChange={e => setNovoEleitor({...novoEleitor, zona_eleitoral: e.target.value})} />
              <input style={{...estiloInput, flex: 1}} placeholder="Seção" value={novoEleitor.secao_eleitoral} onChange={e => setNovoEleitor({...novoEleitor, secao_eleitoral: e.target.value})} />
            </div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#0369a1', fontWeight: 'bold', marginBottom: 8 }}>📋 TERMO — LGPD / TSE</p>
              <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 12 }}>
                Autorizo o tratamento dos meus dados para fins de comunicação política, conforme <strong>Lei nº 13.709/2018</strong> e <strong>Resoluções do TSE</strong>.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={termoAceito} onChange={e => setTermoAceito(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18 }} />
                <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>Li e aceito o Termo (v1.0 — 2026)</span>
              </label>
            </div>
            <button onClick={cadastrarEleitor} disabled={loading} style={estiloBotao('#16a34a')}>{loading ? 'Salvando...' : '✅ Cadastrar Eleitor'}</button>
            <button onClick={() => setShowEleitor(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL LIDERANÇA */}
      {showLider && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowLider(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#7c3aed', marginBottom: 20 }}>➕ Cadastrar Liderança</h2>
            <input style={estiloInput} placeholder="Nome *" value={novaLider.nome} onChange={e => setNovaLider({...novaLider, nome: e.target.value})} />
            <input style={estiloInput} placeholder="Telefone" value={novaLider.telefone} onChange={e => setNovaLider({...novaLider, telefone: e.target.value})} />
            <input style={estiloInput} placeholder="Bairro" value={novaLider.bairro} onChange={e => setNovaLider({...novaLider, bairro: e.target.value})} />
            <textarea style={{...estiloInput, resize: 'vertical'}} placeholder="Demanda" rows={3} value={novaLider.demanda} onChange={e => setNovaLider({...novaLider, demanda: e.target.value})} />
            <button onClick={cadastrarLider} disabled={loading} style={estiloBotao('#7c3aed')}>{loading ? 'Salvando...' : '✅ Cadastrar Liderança'}</button>
            <button onClick={() => setShowLider(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL REUNIÃO */}
      {showReuniao && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowReuniao(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#d97706', marginBottom: 20 }}>➕ Agendar Reunião</h2>
            <input style={estiloInput} placeholder="Título *" value={novaReuniao.titulo} onChange={e => setNovaReuniao({...novaReuniao, titulo: e.target.value})} />
            <input style={estiloInput} type="datetime-local" value={novaReuniao.data} onChange={e => setNovaReuniao({...novaReuniao, data: e.target.value})} />
            <input style={estiloInput} placeholder="Local" value={novaReuniao.local} onChange={e => setNovaReuniao({...novaReuniao, local: e.target.value})} />
            <button onClick={cadastrarReuniao} disabled={loading} style={estiloBotao('#d97706')}>{loading ? 'Salvando...' : '✅ Agendar Reunião'}</button>
            <button onClick={() => setShowReuniao(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL ANOTAÇÃO */}
      {showAnotacao && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowAnotacao(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#1e40af', marginBottom: 20 }}>📝 Nova Anotação</h2>
            <input style={estiloInput} placeholder="Título *" value={novaAnotacao.titulo} onChange={e => setNovaAnotacao({...novaAnotacao, titulo: e.target.value})} />
            <textarea style={{...estiloInput, resize: 'vertical'}} placeholder="Conteúdo" rows={4} value={novaAnotacao.conteudo} onChange={e => setNovaAnotacao({...novaAnotacao, conteudo: e.target.value})} />
            <button onClick={cadastrarAnotacao} disabled={loading} style={estiloBotao('#1e40af')}>{loading ? 'Salvando...' : '✅ Salvar Anotação'}</button>
            <button onClick={() => setShowAnotacao(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
