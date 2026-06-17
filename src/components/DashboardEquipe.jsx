import { useState, useEffect, useRef } from 'react';
import TermoLGPD from '../TermoLGPD';
import { LISTA_BAIRROS, LISTA_MUNICIPIOS } from '../lib/bairros';
import { supabase } from '../lib/supabase';
import MapaPage from '../MapaPage';
import GestaoAnotacoes from '../GestaoAnotacoes';
import GestaoMidias from '../GestaoMidias';
import { registrarLog as logBase } from '../lib/logAtividade';
import DisparoLink from './DisparoLink';
import Comunicado from './Comunicado';
import { linkMapaReuniao } from '../lib/mapa.js';

const BAIRROS_AMAPA = LISTA_BAIRROS;

const ZONAS_AMAPA = Array.from({ length: 35 }, (_, i) => String(i + 1));

const formatarWhatsApp = (telefone) => {
  if (!telefone) return null;
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length < 8) return null;
  return numeros.startsWith('55') ? numeros : `55${numeros}`;
};

const linkWhatsApp = (telefone, nome) => {
  const numero = formatarWhatsApp(telefone);
  if (!numero) return null;
  const mensagem = `Olá, ${nome || 'apoiador'}! 👋\n\nVocê está recebendo novidades de *Deputado Demo*.\n\nPara parar de receber mensagens, responda *SAIR* a qualquer momento. ✅`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
};



const estiloInput = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '12px',
  boxSizing: 'border-box',
};

const estiloModal = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
};

const estiloCard = {
  backgroundColor: 'white', borderRadius: '20px', padding: '32px',
  width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
};

const estiloBotao = (cor) => ({
  width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
  backgroundColor: cor, color: 'white', fontSize: '16px',
  fontWeight: 'bold', cursor: 'pointer', marginTop: '8px',
});

// Hook para detectar mobile (largura < 768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function RelatorioImpressao({ titulo, dados, colunas, onFechar }) {
  const ref = useRef();
  const imprimir = () => {
    const conteudo = ref.current.innerHTML;
    const janela = window.open('', '_blank');
    janela.document.write(`<html><head><title>${titulo}</title><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111}
      h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#1e40af;color:white;padding:10px 12px;text-align:left;font-size:13px}
      td{padding:9px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
      tr:nth-child(even){background:#f9fafb}
      .footer{margin-top:30px;font-size:12px;color:#9ca3af;text-align:center}
      .conf{margin-top:16px;padding:10px 14px;border:1px solid #fca5a5;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:12px;line-height:1.5}
      @media print{button{display:none}}
    </style></head><body>${conteudo}</body></html>`);
    janela.document.close();
    janela.focus();
    setTimeout(() => { janela.print(); janela.close(); }, 500);
  };
  return (
    <div style={estiloModal} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ ...estiloCard, maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1e40af', margin: 0 }}>🖨️ {titulo}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={imprimir} style={{ background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir / PDF</button>
            <button onClick={onFechar} style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>Fechar</button>
          </div>
        </div>
        <div ref={ref}>
          <h1>{titulo}</h1>
          <p>Gabinete Demo 2026 | {new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Total:</strong> {dados.length}</p>
          <table>
            <thead><tr>{colunas.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>{dados.map((item, i) => <tr key={i}>{colunas.map(c => <td key={c.key}>{item[c.key] || '—'}</td>)}</tr>)}</tbody>
          </table>
          <div className="conf">🔒 <strong>DOCUMENTO INTERNO E CONFIDENCIAL — LGPD.</strong> Contém dados pessoais de apoiadores (Lei nº 13.709/2018). Uso restrito à equipe autorizada do gabinete, exclusivamente para a finalidade consentida. <strong>Proibido compartilhar, encaminhar (inclusive por WhatsApp), publicar ou repassar a terceiros.</strong></div>
          <div class="footer">Relatório — Gabinete Digital CRM Político | Gabinete Demo 2026</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardEquipe({ perfil }) {
  const isMobile = useIsMobile(); // responsividade mobile
  const registrarLog = (acao, detalhes) => logBase(perfil, acao, detalhes);
  const registrarClique = async (canal, bairro = '', eleitorId = null) => {
    await supabase.from('rastreamento_links').insert({
      canal, bairro, eleitor_id: eleitorId, data_clique: new Date().toISOString(),
    });
  };
  const [eleitores, setEleitores] = useState([]);
  const [liderancas, setLiderancas] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('inicio');
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);
  const [relatorio, setRelatorio] = useState(null);

  const [config, setConfig] = useState(null);
  const [showEleitor, setShowEleitor] = useState(false);
  const [showLider, setShowLider] = useState(false);
  const [showReuniao, setShowReuniao] = useState(false);
  const [showMidias, setShowMidias] = useState(false);
  const [disparoCanal, setDisparoCanal] = useState(null);
  const [showComunicado, setShowComunicado] = useState(false);

  const [novoEleitor, setNovoEleitor] = useState({
    nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: ''
  });
  const [novaLider, setNovaLider] = useState({ nome: '', telefone: '', bairro: '', demanda: '', endereco: '', municipio: '', zona_eleitoral: '', secao_eleitoral: '' });
  const [novaReuniao, setNovaReuniao] = useState({ titulo: '', data: '', local: '', endereco: '' });

  const LIDERANCA_ID = '9abe9897-068f-4dab-90eb-94d5ceb0a575';

  useEffect(() => {
    fetchAll();
    supabase.from('config_candidato').select('*').limit(1).maybeSingle().then(({ data }) => setConfig(data));
  }, []);

  const fetchAll = async () => {
    const [e, l, r] = await Promise.all([
      supabase.from('eleitores').select('*').order('created_at', { ascending: false }),
      supabase.from('liderancas').select('*').order('created_at', { ascending: false }),
      supabase.from('reunioes').select('*').order('data', { ascending: false }),
    ]);
    if (e.data) setEleitores(e.data);
    if (l.data) setLiderancas(l.data);
    if (r.data) setReunioes(r.data);
    setLoading(false);
  };

  const cadastrarEleitor = async () => {
    if (!termoAceito) return alert('❌ Aceite o Termo LGPD/TSE.');
    if (!novoEleitor.nome || !novoEleitor.telefone) return alert('❌ Nome e telefone obrigatórios.');
    setSalvando(true);
    const { error } = await supabase.from('eleitores').insert([{ ...novoEleitor, consentimento_lgpd: true, data_consentimento: new Date().toISOString() }]);
    if (!error) { await registrarLog('Cadastrou apoiador', `Nome: ${novoEleitor.nome} | Bairro: ${novoEleitor.bairro || '-'}`); alert('✅ Apoiador cadastrado!'); fetchAll(); setNovoEleitor({ nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: '' }); setTermoAceito(false); setShowEleitor(false); }
    else alert('Erro: ' + error.message);
    setSalvando(false);
  };

  const cadastrarLider = async () => {
    if (!novaLider.nome) return alert('❌ Nome obrigatório.');
    setSalvando(true);
    const { zona_eleitoral, secao_eleitoral, ...dadosLider } = novaLider;
    const { data: nova, error } = await supabase.from('liderancas').insert([dadosLider]).select('id').single();
    if (!error) {
      // Liderança também vira eleitor (aparece no mapa e na lista) — best-effort
      await supabase.from('eleitores').insert({
        nome: novaLider.nome, telefone: novaLider.telefone, bairro: novaLider.bairro,
        endereco: novaLider.endereco, municipio: novaLider.municipio || null, lideranca_id: nova.id, tags: ['liderança'],
        zona_eleitoral: novaLider.zona_eleitoral || null, secao_eleitoral: novaLider.secao_eleitoral || null,
        consentimento_lgpd: true, data_consentimento: new Date().toISOString(),
      });
      await registrarLog('Cadastrou liderança', `Nome: ${novaLider.nome} | Bairro: ${novaLider.bairro || '-'}`); alert('✅ Liderança cadastrada!'); fetchAll(); setNovaLider({ nome: '', telefone: '', bairro: '', demanda: '', endereco: '', municipio: '', zona_eleitoral: '', secao_eleitoral: '' }); setShowLider(false);
    }
    else alert('Erro: ' + error.message);
    setSalvando(false);
  };

  const cadastrarReuniao = async () => {
    if (!novaReuniao.titulo || !novaReuniao.data) return alert('❌ Título e data obrigatórios.');
    setSalvando(true);
    const { error } = await supabase.from('reunioes').insert([novaReuniao]);
    if (!error) { await registrarLog('Agendou reunião', `Título: ${novaReuniao.titulo} | Data: ${novaReuniao.data}`); alert('✅ Reunião agendada!'); fetchAll(); setNovaReuniao({ titulo: '', data: '', local: '', endereco: '' }); setShowReuniao(false); }
    else alert('Erro: ' + error.message);
    setSalvando(false);
  };

  const registrarOptOut = async (eleitor) => {
    if (!confirm(`Registrar opt-out de ${eleitor.nome}?`)) return;
    const { error } = await supabase
      .from('eleitores')
      .update({ opt_out: true, data_opt_out: new Date().toISOString() })
      .eq('id', eleitor.id);
    if (error) alert('Erro: ' + error.message);
    else {
      alert(`✅ Opt-out registrado para ${eleitor.nome}.`);
      fetchAll();
    }
  };

  const reativarEleitor = async (eleitor) => {
    const { error } = await supabase
      .from('eleitores')
      .update({ opt_out: false, data_opt_out: null })
      .eq('id', eleitor.id);
    if (error) alert('Erro: ' + error.message);
    else fetchAll();
  };

  const abrirRelatorio = (tipo) => {
    const configs = {
      eleitores: {
        titulo: 'Relatório de Apoiadores',
        dados: eleitores.map(e => ({ nome: e.nome, telefone: e.telefone, bairro: e.bairro || '—', zona: e.zona_eleitoral ? `Zona ${e.zona_eleitoral}` : '—', secao: e.secao_eleitoral || '—', municipio: e.municipio || 'Macapá', data: e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '—' })),
        colunas: [{ key: 'nome', label: 'Nome' }, { key: 'telefone', label: 'Telefone' }, { key: 'bairro', label: 'Bairro' }, { key: 'zona', label: 'Zona' }, { key: 'secao', label: 'Seção' }, { key: 'municipio', label: 'Município' }, { key: 'data', label: 'Cadastrado' }]
      },
      liderancas: {
        titulo: 'Relatório de Lideranças',
        dados: liderancas.map(l => ({ nome: l.nome, telefone: l.telefone || '—', bairro: l.bairro || '—', demanda: l.demanda || '—', data: l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—' })),
        colunas: [{ key: 'nome', label: 'Nome' }, { key: 'telefone', label: 'Telefone' }, { key: 'bairro', label: 'Bairro' }, { key: 'demanda', label: 'Demanda' }, { key: 'data', label: 'Cadastrado' }]
      },
      reunioes: {
        titulo: 'Relatório de Reuniões',
        dados: reunioes.map(r => ({ titulo: r.titulo, data: r.data ? new Date(r.data).toLocaleString('pt-BR') : '—', local: r.local || '—', endereco: r.endereco || '—' })),
        colunas: [{ key: 'titulo', label: 'Título' }, { key: 'data', label: 'Data/Hora' }, { key: 'local', label: 'Local' }, { key: 'endereco', label: 'Endereço' }]
      }
    };
    setRelatorio(configs[tipo]);
  };

  const eleitorFiltrados = eleitores.filter(e =>
    e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.bairro?.toLowerCase().includes(busca.toLowerCase()) ||
    e.telefone?.includes(busca)
  );

  const dispararParaTodos = async () => {
    const comWhats = eleitorFiltrados.filter(e => !e.opt_out && formatarWhatsApp(e.telefone));
    if (comWhats.length === 0) return alert('❌ Nenhum apoiador com WhatsApp válido.');
    if (!confirm(`Disparar para ${comWhats.length} eleitores?`)) return;
    for (const e of comWhats) {
      await registrarClique('whatsapp_massa', e.bairro || '', e.id);
      window.open(linkWhatsApp(e.telefone, e.nome), '_blank');
      await new Promise(r => setTimeout(r, 800));
    }
  };

  if (aba === 'mapa') return (
    <div>
      <button onClick={() => setAba('inicio')} style={{ margin: '20px', padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
      <MapaPage />
    </div>
  );

  if (showMidias) return <GestaoMidias onVoltar={() => setShowMidias(false)} />;

  if (aba === 'anotacoes') return <GestaoAnotacoes liderancaId={LIDERANCA_ID} onVoltar={() => setAba('inicio')} />;

  return (
    <div style={{ background: "#0a0f1c", padding: 20, minHeight: "100vh", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ background: "#ffffff", borderRadius: 24, padding: "32px 40px", color: "white" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{config?.nome || 'Deputado Demo'}</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>Apoiadores: {eleitores.length} | Lideranças: {liderancas.length} | Reuniões: {reunioes.length}</p>
      </div>

      {/* Botões */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => setShowEleitor(true)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Apoiador</button>
        <button onClick={() => setShowLider(true)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Liderança</button>
        <button onClick={() => { navigator.clipboard.writeText('https://gabinete-demo.vercel.app/#/cadastro'); registrarLog('Copiou link de cadastro', 'Link público genérico (apoiador/liderança)'); alert('🔗 Link de cadastro copiado!\n\nCole no WhatsApp ou redes — a pessoa escolhe se cadastrar como Apoiador ou Liderança.'); }} style={{ background: "#1e40af", border: "1px solid #2563eb", borderRadius: 8, color: "#fff", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>🔗 Link de cadastro</button>
        <button onClick={() => setShowReuniao(true)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Reunião</button>
        <button onClick={() => setAba('mapa')} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>🗺️ Mapa</button>
        <button onClick={() => setAba('anotacoes')} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>📝 Anotações</button>
        <button onClick={() => setShowMidias(true)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>📤 Mídias</button>
      </div>

      {/* Central de Comunicação */}
      <div style={{ background: '#111827', borderRadius: 12, padding: 20, border: '1px solid #1f2937' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e40af', marginBottom: '6px' }}>📣 Central de Comunicação</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Todos os cliques são rastreados automaticamente.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href={config?.instagram || '#'} target="_blank" rel="noopener noreferrer"
              onClick={() => { if (config?.instagram) registrarClique('instagram', 'equipe'); }}
              style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: 'white', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', ...(!config?.instagram ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}>
              📸 Instagram
            </a>
            <button onClick={() => setDisparoCanal('instagram')}
              style={{ padding: '11px', borderRadius: '10px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              🎯 Gerar links rastreados
            </button>
          </div>
        </div>
        {disparoCanal && (
          <DisparoLink canal={disparoCanal} eleitores={eleitores} liderancas={liderancas} onClose={() => setDisparoCanal(null)} />
        )}
      </div>

      {/* GRID 3 COLUNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>

        {/* Apoiadores */}
        <div style={{ background: '#111827', borderRadius: 12, padding: 20, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#60a5fa', margin: 0 }}>👥 Apoiadores ({eleitores.length})</h3>
            <button onClick={dispararParaTodos} style={{ padding: "8px 14px", borderRadius: 6, background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", cursor: "pointer", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
              📱 Disparar ({eleitorFiltrados.filter(e => !e.opt_out && formatarWhatsApp(e.telefone)).length})
            </button>
          </div>
          <input type="text" placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box', background: '#0a0f1c', color: '#f1f5f9' }} />
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>⏳ Carregando...</p> :
              eleitorFiltrados.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum apoiador.</p> :
              eleitorFiltrados.map(e => {
                const linkWA = !e.opt_out && linkWhatsApp(e.telefone, e.nome);
                return (
                  <div key={e.id} style={{ background: e.opt_out ? '#1e293b' : '#111827', borderRadius: '10px', padding: '10px', border: `1px solid ${e.opt_out ? '#334155' : '#1f2937'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{e.nome}</p>
                        <p style={{ color: '#94a3b8', fontSize: '12px' }}>📱 {e.telefone}</p>
                        {e.bairro && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {e.bairro}</p>}
                        {e.zona_eleitoral && <p style={{ color: '#94a3b8', fontSize: '11px' }}>🗳️ Zona {e.zona_eleitoral}{e.secao_eleitoral ? ` • Seção ${e.secao_eleitoral}` : ''}</p>}
                        {e.opt_out && <p style={{ color: '#92400e', fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>🚫 Opt-out LGPD</p>}
                      </div>
                      {e.opt_out ? (
                        <button onClick={() => reativarEleitor(e)} style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                          ✅ Reativar
                        </button>
                      ) : (
                        <button onClick={() => registrarOptOut(e)} style={{ background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                          🚫 SAIR
                        </button>
                      )}
                    </div>
                    {linkWA && (
                      <a href={linkWA} target="_blank" rel="noopener noreferrer"
                        onClick={() => registrarClique('whatsapp_eleitor', e.bairro || '', e.id)}
                        style={{ padding: "8px 14px", borderRadius: 6, background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", cursor: "pointer", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                        📱 WhatsApp
                      </a>
                    )}
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Lideranças */}
        <div style={{ background: '#111827', borderRadius: 12, padding: 20, border: '1px solid #1f2937' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#94a3b8', marginBottom: '12px' }}>🤝 Lideranças ({liderancas.length})</h3>
          <div style={{ maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {liderancas.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma liderança.</p> :
              liderancas.map(l => {
                const linkWA = linkWhatsApp(l.telefone, l.nome);
                return (
                  <div key={l.id} style={{ background: '#111827', borderRadius: 8, padding: '10px', border: '1px solid #1f2937'}}>
                    <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{l.nome}</p>
                    {l.telefone && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📱 {l.telefone}</p>}
                    {l.bairro && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {l.bairro}</p>}
                    {l.demanda && <p style={{ color: '#94a3b8', fontSize: '11px' }}>💬 {l.demanda}</p>}
                    {linkWA && (
                      <a href={linkWA} target="_blank" rel="noopener noreferrer"
                        onClick={() => registrarClique('whatsapp_lider', l.bairro || '', l.id)}
                        style={{ padding: "8px 14px", borderRadius: 6, background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", cursor: "pointer", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                        📱 WhatsApp
                      </a>
                    )}
                      <button onClick={() => { navigator.clipboard.writeText('https://gabinete-demo.vercel.app/#/cadastro/' + l.id); alert('Link copiado!'); }} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginTop: '6px', display: 'inline-block' }}>🔗 Link</button>
                    </div>
                );
              })
            }
          </div>
        </div>

        {/* Reuniões */}
        <div style={{ background: '#111827', borderRadius: 12, padding: 20, border: '1px solid #1f2937' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#60a5fa', marginBottom: '12px' }}>📅 Reuniões ({reunioes.length})</h3>
          <button onClick={() => setShowComunicado(true)}
            style={{ width: '100%', marginBottom: 12, padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            📣 Comunicado por liderança
          </button>
          <div style={{ maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reunioes.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma reunião.</p> :
              reunioes.map(r => (
                <div key={r.id} style={{ background: '#111827', borderRadius: 8, padding: 10, border: '1px solid #1f2937'}}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{r.titulo}</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>📅 {r.data ? new Date(r.data).toLocaleString('pt-BR') : '—'}</p>
                  {r.local && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {r.local}</p>}
                  {linkMapaReuniao(r) && (
                    <a href={linkMapaReuniao(r)} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 4, color: '#60a5fa', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📍 Abrir no mapa</a>
                  )}
                </div>
              ))
            }
          </div>
        </div>

      </div>

      <p className="text-center text-green-600 font-bold">✅ Tudo que a Equipe cadastra aparece automaticamente no perfil do Deputado.</p>

      {relatorio && <RelatorioImpressao {...relatorio} onFechar={() => setRelatorio(null)} />}
      {showComunicado && (
        <Comunicado eleitores={eleitores} liderancas={liderancas} reunioes={reunioes}
          onEnviar={({ lideranca, total }) => registrarLog('Enviou comunicado', `Liderança: ${lideranca} | ${total} destinatários`)}
          onClose={() => setShowComunicado(false)} />
      )}

      {/* MODAL ELEITOR */}
      {showEleitor && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowEleitor(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#60a5fa', marginBottom: '20px' }}>➕ Cadastrar Apoiador</h2>
            <input style={estiloInput} placeholder="Nome completo *" value={novoEleitor.nome} onChange={e => setNovoEleitor({ ...novoEleitor, nome: e.target.value })} />
            <input style={estiloInput} placeholder="WhatsApp * ex: 96999998888" value={novoEleitor.telefone} onChange={e => setNovoEleitor({ ...novoEleitor, telefone: e.target.value })} />
            <select style={estiloInput} value={novoEleitor.municipio} onChange={e => setNovoEleitor({ ...novoEleitor, municipio: e.target.value, bairro: '' })}>
              <option value="">Selecione o município...</option>
              {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input style={estiloInput} list="bairros-eq-eleitor" autoComplete="off" placeholder="Bairro / comunidade *" value={novoEleitor.bairro} onChange={e => setNovoEleitor({ ...novoEleitor, bairro: e.target.value })} />
            <datalist id="bairros-eq-eleitor">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <input style={estiloInput} placeholder="Endereço completo" value={novoEleitor.endereco} onChange={e => setNovoEleitor({ ...novoEleitor, endereco: e.target.value })} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={novoEleitor.zona_eleitoral} onChange={e => setNovoEleitor({ ...novoEleitor, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Seção" min="1" max="9999" value={novoEleitor.secao_eleitoral} onChange={e => setNovoEleitor({ ...novoEleitor, secao_eleitoral: e.target.value })} />
            </div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold', marginBottom: '8px' }}>📋 TERMO — LGPD / TSE</p>
              <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.6', marginBottom: '12px' }}>
                Autorizo o tratamento dos meus dados para fins de comunicação política do Deputado Demo, conforme <strong>Lei nº 13.709/2018</strong> e <strong>Resoluções do TSE</strong>. Posso revogar respondendo <strong>SAIR</strong>.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={termoAceito} onChange={e => setTermoAceito(e.target.checked)} style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#1e40af' }} />
                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>Li e aceito o Termo (v1.0 — Maio/2026)</span>
              </label>
            </div>
            <button onClick={cadastrarEleitor} disabled={salvando} style={estiloBotao('#16a34a')}>{salvando ? 'Salvando...' : '✅ Cadastrar Apoiador'}</button>
            <button onClick={() => setShowEleitor(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL LIDERANÇA */}
      {showLider && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowLider(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#94a3b8', marginBottom: '20px' }}>➕ Cadastrar Liderança</h2>
            <input style={estiloInput} placeholder="Nome *" value={novaLider.nome} onChange={e => setNovaLider({ ...novaLider, nome: e.target.value })} />
            <input style={estiloInput} placeholder="WhatsApp ex: 96999998888" value={novaLider.telefone} onChange={e => setNovaLider({ ...novaLider, telefone: e.target.value })} />
            <select style={estiloInput} value={novaLider.municipio} onChange={e => setNovaLider({ ...novaLider, municipio: e.target.value, bairro: '' })}>
              <option value="">Selecione o município...</option>
              {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input style={estiloInput} list="bairros-eq-lider" autoComplete="off" placeholder="Bairro / comunidade" value={novaLider.bairro} onChange={e => setNovaLider({ ...novaLider, bairro: e.target.value })} />
            <datalist id="bairros-eq-lider">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={novaLider.zona_eleitoral} onChange={e => setNovaLider({ ...novaLider, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Seção" min="1" max="9999" value={novaLider.secao_eleitoral} onChange={e => setNovaLider({ ...novaLider, secao_eleitoral: e.target.value })} />
            </div>
            <input style={estiloInput} placeholder="Endereço" value={novaLider.endereco} onChange={e => setNovaLider({ ...novaLider, endereco: e.target.value })} />
            <textarea style={{ ...estiloInput, resize: 'vertical' }} placeholder="Demanda / Observação" rows={3} value={novaLider.demanda} onChange={e => setNovaLider({ ...novaLider, demanda: e.target.value })} />
            <button onClick={cadastrarLider} disabled={salvando} style={estiloBotao('#7c3aed')}>{salvando ? 'Salvando...' : '✅ Cadastrar Liderança'}</button>
            <button onClick={() => setShowLider(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL REUNIÃO */}
      {showReuniao && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowReuniao(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#60a5fa', marginBottom: '20px' }}>➕ Agendar Reunião</h2>
            <input style={estiloInput} placeholder="Título *" value={novaReuniao.titulo} onChange={e => setNovaReuniao({ ...novaReuniao, titulo: e.target.value })} />
            <input style={estiloInput} type="datetime-local" value={novaReuniao.data} onChange={e => setNovaReuniao({ ...novaReuniao, data: e.target.value })} />
            <input style={estiloInput} placeholder="Local (ex: Câmara)" value={novaReuniao.local} onChange={e => setNovaReuniao({ ...novaReuniao, local: e.target.value })} />
            <input style={estiloInput} placeholder="Endereço completo" value={novaReuniao.endereco} onChange={e => setNovaReuniao({ ...novaReuniao, endereco: e.target.value })} />
            <button onClick={cadastrarReuniao} disabled={salvando} style={estiloBotao('#d97706')}>{salvando ? 'Salvando...' : '✅ Agendar Reunião'}</button>
            <button onClick={() => setShowReuniao(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

    </div>
  );
}



