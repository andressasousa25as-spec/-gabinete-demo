import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import RankingEngajamento from '../RankingEngajamento';
import CenarioPolitico from './CenarioPolitico';
import MapaPage from '../MapaPage';
import TermoLGPD from '../TermoLGPD';
import GestaoAnotacoes from '../GestaoAnotacoes';
import GestaoMidias from '../GestaoMidias';
import AnalyticsMidias from '../AnalyticsMidias';
import GestaoUsuarios from './GestaoUsuarios';
import { registrarLog as logBase } from '../lib/logAtividade';
import { useCandidatoAnalise } from '../lib/useCandidatoAnalise';
import { coordConfiavel, MACAPA_CENTRO, AMAPA_BBOX, COORDS_BAIRROS, LISTA_BAIRROS, LISTA_MUNICIPIOS } from '../lib/bairros';
import DiagnosticoEleitoral from './DiagnosticoEleitoral';
import CaminhoVitoria from './CaminhoVitoria';
import MapaEleitoral from './MapaEleitoral';
import AnaliseTerritorial from './AnaliseTerritorial';
import RadarOportunidade from './RadarOportunidade';
import ProjecaoEstrategica from './ProjecaoEstrategica';
import CenarioVereador2024 from './CenarioVereador2024';
import CenarioMunicipal from '../CenarioMunicipal';
import Comunicado from './Comunicado';
import GestaoDemandas from './GestaoDemandas';
import InstalarAppButton from './InstalarAppButton';
import PendingBadge from './PendingBadge';
import { linkMapaReuniao } from '../lib/mapa.js';
import { localDeVotacao } from '../lib/locaisVotacao';



const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FiaW5ldGVkaWdpdGFsc2YiLCJhIjoiY21wb3o3cjBjMDY1djJzcHZyOXM4Y3JmZSJ9.S1a4VYKtkm_2Bn3Hxowugw';

// Geocodifica via Mapbox ancorado em Macapá/Amapá (proximity + bbox) e valida
// com coordConfiavel (rede de segurança: se cair no rio/fora do bairro, usa o
// centro do bairro). Mesma lógica do Mapa — nunca grava coordenada absurda.
async function geocodificarEleitor(eleitor) {
  const cidade = eleitor.municipio || 'Macapá';
  const partes = [eleitor.endereco, eleitor.bairro, cidade, 'Amapá', 'Brasil'].filter(Boolean);
  const query = encodeURIComponent(partes.join(', '));
  const prox = `${MACAPA_CENTRO.longitude},${MACAPA_CENTRO.latitude}`;
  const bbox = `${AMAPA_BBOX.lngMin},${AMAPA_BBOX.latMin},${AMAPA_BBOX.lngMax},${AMAPA_BBOX.latMax}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1&language=pt&proximity=${prox}&bbox=${bbox}`;
  let bruto = null;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      bruto = { latitude: lat, longitude: lng };
    }
  } catch (e) {}
  return coordConfiavel(bruto, eleitor.bairro, eleitor.municipio);
}

const BAIRROS_AMAPA = LISTA_BAIRROS;

const ZONAS_AMAPA = Array.from({ length: 35 }, (_, i) => String(i + 1));

const estiloModal = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
};

const estiloCard = {
  backgroundColor: 'white', borderRadius: '20px', padding: '32px', color: '#111827',
  width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
};

const estiloInput = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '12px',
  boxSizing: 'border-box'
};

const estiloBotao = (cor) => ({
  width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
  backgroundColor: cor, color: 'white', fontSize: '16px',
  fontWeight: 'bold', cursor: 'pointer', marginTop: '8px'
});

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


export default function DashboardCandidato({ perfil, ehMaster }) {
  const registrarLog = (acao, detalhes) => logBase(perfil, acao, detalhes);
  const [eleitores, setEleitores] = useState([]);
  const [liderancas, setLiderancas] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [rastreamento, setRastreamento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [fotoSubindo, setFotoSubindo] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [config, setConfig] = useState({ nome: 'Deputado Demo', cargo: 'Deputado Estadual — AP', estado: 'AP', bairro: '', endereco: '', latitude: '', longitude: '' });
  const [aba, setAba] = useState('inicio');
  const { candidato: analiseCand } = useCandidatoAnalise();
  const [relatorio, setRelatorio] = useState(null);
  const [showComunicado, setShowComunicado] = useState(false);
  const [busca, setBusca] = useState('');
  const [relLider, setRelLider] = useState(''); // filtro do relatório de apoiadores por liderança ('' = geral)

  const [showEleitor, setShowEleitor] = useState(false);
  const [eleitorEditando, setEleitorEditando] = useState(null);
  const [liderEditando, setLiderEditando] = useState(null);
  const [showMapaSelecao, setShowMapaSelecao] = useState(false);
  const mapaSelecaoRef = useRef(null);
  const [coordsManual, setCoordsManual] = useState(null);
  const mapInstanceRef = useRef(null);
  const [showLider, setShowLider] = useState(false);
  const [showReuniao, setShowReuniao] = useState(false);

  const [novoEleitor, setNovoEleitor] = useState({ nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: '', lideranca_id: null, observacao: '' });
  const [novaLider, setNovaLider] = useState({ nome: '', telefone: '', bairro: '', demanda: '', endereco: '', municipio: '', zona_eleitoral: '', secao_eleitoral: '' });
  const [novaReuniao, setNovaReuniao] = useState({ titulo: '', data: '', local: '', endereco: '' });
  const [termoAceito, setTermoAceito] = useState(false);

  const LIDERANCA_ID = '9abe9897-068f-4dab-90eb-94d5ceb0a575';

  useEffect(() => {
    const carregarConfig = async () => {
      const { data } = await supabase.from('config_candidato').select('*').limit(1).maybeSingle();
      if (data) setConfig(data);
    };
    carregarConfig(); fetchAll(); }, []);

  const fetchAll = async () => {
    const [e, l, r, rt] = await Promise.all([
      supabase.from('eleitores').select('*').order('created_at', { ascending: false }),
      supabase.from('liderancas').select('*').order('created_at', { ascending: false }),
      supabase.from('reunioes').select('*').order('data', { ascending: false }),
      supabase.from('rastreamento_links').select('*').order('data_clique', { ascending: false }),
    ]);
    if (e.data) setEleitores(e.data);
    if (l.data) setLiderancas(l.data);
    if (r.data) setReunioes(r.data);
    if (rt.data) setRastreamento(rt.data);
  };

  const cadastrarEleitor = async () => {
    if (!novoEleitor.endereco) return alert('Endereço obrigatório para posicionar no mapa.'); setLoading(false);
    if (!termoAceito) return alert('❌ Aceite o Termo LGPD/TSE.');
    if (!novoEleitor.nome || !novoEleitor.telefone) return alert('❌ Nome e telefone obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('eleitores').insert([{ ...novoEleitor, lideranca_id: novoEleitor.lideranca_id || null, consentimento_lgpd: true, data_consentimento: new Date().toISOString() }]);
    if (!error) {
      const coords = await geocodificarEleitor(novoEleitor);
      if (coords) {
        const { data: saved } = await supabase.from('eleitores').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (saved) await supabase.from('eleitores').update({ latitude: coords.latitude, longitude: coords.longitude }).eq('id', saved.id);
        alert('Apoiador cadastrado!'); fetchAll();
      } else {
        alert('Endereço não localizado automaticamente. Por favor, posicione o apoiador no mapa.');
        setLoading(false);
        setShowMapaSelecao(true);
        return;
      } setNovoEleitor({ nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: '' }); setTermoAceito(false); setShowEleitor(false); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const cadastrarLider = async () => {
    if (!novaLider.nome) return alert('❌ Nome obrigatório.');
    setLoading(true);
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
      await registrarLog('Cadastrou liderança', `Nome: ${novaLider.nome} | Bairro: ${novaLider.bairro || '-'}`); alert('✅ Liderança salva!'); fetchAll(); setNovaLider({ nome: '', telefone: '', bairro: '', demanda: '', endereco: '', municipio: '', zona_eleitoral: '', secao_eleitoral: '' }); setShowLider(false);
    }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const cadastrarReuniao = async () => {
    if (!novaReuniao.titulo || !novaReuniao.data) return alert('❌ Título e data obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('reunioes').insert([novaReuniao]);
    if (!error) { await registrarLog('Agendou reunião', `Título: ${novaReuniao.titulo} | Data: ${novaReuniao.data}`); alert('✅ Reunião agendada!'); fetchAll(); setNovaReuniao({ titulo: '', data: '', local: '', endereco: '' }); setShowReuniao(false); }
    else alert('Erro: ' + error.message);
    setLoading(false);
  };


  useEffect(() => {
    if (!showMapaSelecao) return;
    // Garantir que o Mapbox CSS esta carregado
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(link);
    }
    // Carregar Mapbox JS se necessario
    const initMapa = () => {
      setTimeout(() => {
        if (!mapaSelecaoRef.current) return;
        if (mapInstanceRef.current) { mapInstanceRef.current.resize(); return; }
        if (!window.mapboxgl) { console.warn('Mapbox nao carregado'); return; }
        const m = new window.mapboxgl.Map({
          container: mapaSelecaoRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-51.0665, 0.0350],
          zoom: 13,
          accessToken: 'pk.eyJ1IjoiZ2FiaW5ldGVkaWdpdGFsc2YiLCJhIjoiY21wb3o3cjBjMDY1djJzcHZyOXM4Y3JmZSJ9.S1a4VYKtkm_2Bn3Hxowugw'
        });
        const marker = new window.mapboxgl.Marker({ draggable: true, color: '#2563eb' })
          .setLngLat([-51.0665, 0.0350]).addTo(m);
        marker.on('dragend', () => {
          const { lng, lat } = marker.getLngLat();
          setCoordsManual({ latitude: lat, longitude: lng });
        });
        setCoordsManual({ latitude: 0.0350, longitude: -51.0665 });
        mapInstanceRef.current = m;
      }, 600);
    };
    if (!window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = initMapa;
      document.head.appendChild(script);
    } else {
      initMapa();
    }
    setTimeout(() => {
      if (!mapaSelecaoRef.current || mapInstanceRef.current) return;
      const m = new window.mapboxgl.Map({
        container: mapaSelecaoRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-51.0665, 0.0350],
        zoom: 13,
        accessToken: 'pk.eyJ1IjoiZ2FiaW5ldGVkaWdpdGFsc2YiLCJhIjoiY21wb3o3cjBjMDY1djJzcHZyOXM4Y3JmZSJ9.S1a4VYKtkm_2Bn3Hxowugw'
      });
      const marker = new window.mapboxgl.Marker({ draggable: true, color: '#2563eb' })
        .setLngLat([-51.0665, 0.0350]).addTo(m);
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        setCoordsManual({ latitude: lat, longitude: lng });
      });
      setCoordsManual({ latitude: 0.0350, longitude: -51.0665 });
      mapInstanceRef.current = m;
    }, 400);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [showMapaSelecao]);

  const cadastrarEleitorComCoords = async (coords) => {
    const dadosFinais = { ...novoEleitor, lideranca_id: novoEleitor.lideranca_id || null, consentimento_lgpd: true, data_consentimento: new Date().toISOString(), ...(coords || {}) };
    // Apenas atualiza coordenadas do apoiador ja cadastrado
    const { data: saved } = await supabase.from('eleitores').select('id').eq('nome', novoEleitor.nome).maybeSingle();
    if (saved) {
      await supabase.from('eleitores').update({ latitude: coords.latitude, longitude: coords.longitude }).eq('id', saved.id);
      await registrarLog?.('Cadastrou apoiador', `Nome: ${novoEleitor.nome}`);
      alert('Apoiador salvo com localizacao!');
      fetchAll();
      setNovoEleitor({ nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: '', lideranca_id: null });
      setTermoAceito?.(false);
      setShowEleitor(false);
      setShowMapaSelecao(false);
    }
    return;
    if (!error) {
      await registrarLog?.('Cadastrou apoiador', `Nome: ${novoEleitor.nome} | Bairro: ${novoEleitor.bairro || '-'}`);
      alert('Apoiador cadastrado!');
      fetchAll();
      setNovoEleitor({ nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: '' });
      setTermoAceito?.(false);
      setShowEleitor(false);
    } else alert('Erro: ' + error.message);
  };

  const salvarEdicaoEleitor = async () => {
    if (!eleitorEditando.nome || !eleitorEditando.telefone) return alert('Nome e telefone obrigatorios.');
    setLoading(true);
    const { error } = await supabase.from('eleitores').update({
      nome: eleitorEditando.nome,
      telefone: eleitorEditando.telefone,
      bairro: eleitorEditando.bairro,
      endereco: eleitorEditando.endereco,
      municipio: eleitorEditando.municipio,
      zona_eleitoral: eleitorEditando.zona_eleitoral,
      secao_eleitoral: eleitorEditando.secao_eleitoral,
      lideranca_id: eleitorEditando.lideranca_id || null,
      observacao: eleitorEditando.observacao || null,
    }).eq('id', eleitorEditando.eleitor_id || eleitorEditando.id);
    if (!error) {
      alert('Apoiador atualizado!');
      fetchAll();
      setEleitorEditando(null);
    } else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const abrirEditarLider = async (l) => {
    // Zona/seção da liderança moram no registro de eleitor dela (tag 'liderança')
    const { data } = await supabase.from('eleitores')
      .select('id, zona_eleitoral, secao_eleitoral')
      .eq('lideranca_id', l.id).contains('tags', ['liderança'])
      .limit(1).maybeSingle();
    setLiderEditando({ ...l, zona_eleitoral: data?.zona_eleitoral || '', secao_eleitoral: data?.secao_eleitoral || '', _eleitorId: data?.id || null });
  };

  const salvarEdicaoLider = async () => {
    if (!liderEditando.nome) return alert('Nome obrigatorio.');
    setLoading(true);
    const { error } = await supabase.from('liderancas').update({
      nome: liderEditando.nome,
      telefone: liderEditando.telefone,
      bairro: liderEditando.bairro,
      endereco: liderEditando.endereco,
      municipio: liderEditando.municipio,
      demanda: liderEditando.demanda,
    }).eq('id', liderEditando.id);
    if (error) { alert('Erro: ' + error.message); setLoading(false); return; }
    // Sincroniza o registro de eleitor da liderança (onde ficam zona/seção)
    const dadosEleitor = {
      nome: liderEditando.nome, telefone: liderEditando.telefone, bairro: liderEditando.bairro,
      endereco: liderEditando.endereco, municipio: liderEditando.municipio,
      zona_eleitoral: liderEditando.zona_eleitoral, secao_eleitoral: liderEditando.secao_eleitoral,
    };
    if (liderEditando._eleitorId) {
      await supabase.from('eleitores').update(dadosEleitor).eq('id', liderEditando._eleitorId);
    } else {
      await supabase.from('eleitores').insert({ ...dadosEleitor, lideranca_id: liderEditando.id, tags: ['liderança'], consentimento_lgpd: true, data_consentimento: new Date().toISOString(), versao_termo: '1.0' });
    }
    await registrarLog('Editou liderança', `Nome: ${liderEditando.nome}`);
    alert('Liderança atualizada!');
    fetchAll();
    setLiderEditando(null);
    setLoading(false);
  };

  const excluir = async (tabela, id) => {
    if (!confirm('Excluir permanentemente?')) return;
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) alert('Erro: ' + error.message);
    else { await registrarLog('Excluiu registro', `Tabela: ${tabela} | ID: ${id}`); fetchAll(); }
  };

  const salvarConfig = async () => {
    const { error } = await supabase.from('config_candidato').upsert({ ...config, updated_at: new Date().toISOString() });
    if (!error) { alert('Configurações salvas!'); setShowConfig(false); }
    else alert('Erro ao salvar: ' + error.message);
  };

  const abrirRelatorio = (tipo) => {
    const configs = {
      eleitores: {
        titulo: 'Relatório de Apoiadores',
        dados: eleitores.map(e => ({ nome: e.nome, telefone: e.telefone, bairro: e.bairro || '—', zona: e.zona_eleitoral ? `Zona ${e.zona_eleitoral}` : '—', secao: e.secao_eleitoral || '—', local: localDeVotacao(e.zona_eleitoral, e.secao_eleitoral) || '—', municipio: e.municipio || 'Macapá', data: e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '—' })),
        colunas: [{ key: 'nome', label: 'Nome' }, { key: 'telefone', label: 'Telefone' }, { key: 'bairro', label: 'Bairro' }, { key: 'zona', label: 'Zona' }, { key: 'secao', label: 'Seção' }, { key: 'local', label: 'Local de votação' }, { key: 'municipio', label: 'Município' }, { key: 'data', label: 'Cadastrado' }]
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
      },
      comunicacao: {
        titulo: 'Relatório — Central de Comunicação',
        dados: rastreamento.map(r => ({ canal: r.canal, bairro: r.bairro || '—', data_clique: r.data_clique ? new Date(r.data_clique).toLocaleString('pt-BR') : '—' })),
        colunas: [{ key: 'canal', label: 'Canal' }, { key: 'bairro', label: 'Bairro' }, { key: 'data_clique', label: 'Data/Hora' }]
      }
    };
    setRelatorio(configs[tipo]);
  };

  if (aba === 'relatorios') {
  const lideById = Object.fromEntries(liderancas.map(l => [l.id, l.nome]));
  const eleitoresRel = relLider ? eleitores.filter(e => e.lideranca_id === relLider) : eleitores;
  const sufLider = relLider ? ' — ' + (lideById[relLider] || 'Liderança') : '';
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24 }}>
      <button onClick={() => setAba('inicio')} style={{ marginBottom: 20, padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
      <h2 style={{ color: 'white', marginBottom: 20 }}>🖨️ Relatórios</h2>
      <div style={{ marginBottom: 16, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>👥 Filtrar Apoiadores por liderança</label>
        <select value={relLider} onChange={e => setRelLider(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, minWidth: 260 }}>
          <option value="">Geral (todos os apoiadores)</option>
          {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Apoiadores' + sufLider, dados: eleitoresRel.map(e => ({ nome: e.nome, telefone: e.telefone || '-', bairro: e.bairro || '-', zona: e.zona_eleitoral ? 'Zona ' + e.zona_eleitoral : '-', secao: e.secao_eleitoral || '-', local: localDeVotacao(e.zona_eleitoral, e.secao_eleitoral) || '-', municipio: e.municipio || '-', lideranca: lideById[e.lideranca_id] || '-' })), colunas: ['nome','telefone','bairro','zona','secao','local','municipio','lideranca'] },
          { label: 'Lideranças', dados: liderancas.map(l => ({ nome: l.nome, telefone: l.telefone || '-', bairro: l.bairro || '-', demanda: l.demanda || '-' })), colunas: ['nome','telefone','bairro','demanda'] },
          { label: 'Reuniões', dados: reunioes.map(r => ({ titulo: r.titulo, data: r.data ? new Date(r.data).toLocaleString('pt-BR') : '-', local: r.local || '-' })), colunas: ['titulo','data','local'] },
        ].map((rel, i) => (
          <button key={i} onClick={() => {
            const w = window.open('', '_blank');
            const rows = rel.dados.map(d => '<tr>' + rel.colunas.map(col => '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">' + (d[col] || '-') + '</td>').join('') + '</tr>').join('');
            const headers = rel.colunas.map(col => '<th style="padding:10px 12px;background:#1e40af;color:white;text-align:left">' + col + '</th>').join('');
            w.document.write('<html><head><title>' + rel.label + '</title></head><body style="font-family:Arial;padding:20px"><h1 style="color:#1e40af">Gabinete Demo 2026 — ' + rel.label + '</h1><p>Total: ' + rel.dados.length + ' registros | ' + new Date().toLocaleString("pt-BR") + '</p><div style="margin:12px 0;padding:10px 14px;border:1px solid #fca5a5;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:12px;line-height:1.5">🔒 <strong>DOCUMENTO INTERNO E CONFIDENCIAL — LGPD (Lei 13.709/2018).</strong> Dados pessoais de apoiadores. Uso restrito à equipe autorizada. Proibido compartilhar, encaminhar (inclusive por WhatsApp) ou repassar a terceiros.</div><table style="width:100%;border-collapse:collapse"><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></body></html>');
            w.document.close();
            setTimeout(() => w.print(), 500);
          }} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, cursor: 'pointer', color: 'white', fontSize: 15, fontWeight: 700 }}>
            🖨️ {rel.label} ({rel.dados.length})
          </button>
        ))}
      </div>
    </div>
  );
  }
  if (aba === 'ranking') return <RankingEngajamento onVoltar={() => setAba('inicio')} />;
  if (aba === 'admins' && ehMaster) return <GestaoUsuarios perfil={perfil} onVoltar={() => setAba('inicio')} />;
  if (aba === 'diagnostico') return <DiagnosticoEleitoral onVoltar={() => setAba('inicio')} />;
  if (aba === 'mapaeleitoral') return <MapaEleitoral onVoltar={() => setAba('inicio')} />;
  if (aba === 'analise') return <AnaliseTerritorial onVoltar={() => setAba('inicio')} />;
  if (aba === 'radar') return <RadarOportunidade onVoltar={() => setAba('inicio')} />;
  if (aba === 'caminho') return <CaminhoVitoria onVoltar={() => setAba('inicio')} />;
  if (aba === 'projecao') return <ProjecaoEstrategica onVoltar={() => setAba('inicio')} />;
  if (aba === 'cenario-municipal') return <CenarioMunicipal onVoltar={() => setAba('inicio')} />;
  if (aba === 'mapa') return (
    <div>
      <button onClick={() => setAba('inicio')} style={{ margin: '20px', padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
      <MapaPage config={config} />
    </div>
  );

  if (aba === 'anotacoes') return <GestaoAnotacoes liderancaId={LIDERANCA_ID} onVoltar={() => setAba('inicio')} />;

  if (aba === 'demandas') return <GestaoDemandas eleitores={eleitores} liderancas={liderancas} registrarLog={registrarLog} onVoltar={() => setAba('inicio')} />;

  const eleitorFiltrados = eleitores.filter(e =>
    e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.bairro?.toLowerCase().includes(busca.toLowerCase()) ||
    e.telefone?.includes(busca)
  );

  return (
    <div style={{ background: "#0a0f1c", minHeight: "100vh", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, fontFamily: "Inter, system-ui, sans-serif", color: "#f1f5f9" }}>

      {/* Header */}
      <div style={{background:"#ffffff",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,color:"#0f172a",flexWrap:"nowrap"}}>
        {config?.foto_url ? (
          <img src={config.foto_url} alt={config?.nome || 'Deputado Demo'} style={{width:"clamp(60px,15vw,90px)",height:"clamp(60px,15vw,90px)",borderRadius:"50%",border:"3px solid #fbbf24",objectFit:"cover",flexShrink:0}} />
        ) : (
          <div style={{width:"clamp(60px,15vw,90px)",height:"clamp(60px,15vw,90px)",borderRadius:"50%",border:"3px solid #fbbf24",background:"#1e40af",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"clamp(24px,6vw,40px)",flexShrink:0}}>
            {(config?.nome || 'Deputado Demo')[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,32px)",fontWeight:700,color:"#0f172a"}}>{config?.nome || 'Deputado Demo'}</h1>
          <p style={{margin:"4px 0 8px",fontSize:16,color:"#64748b"}}>{config?.cargo || 'Deputado Estadual — AP'}</p>
          <p style={{margin:0,fontSize:14,color:"#64748b"}}>Apoiadores: {eleitores.length} | Lideranças: {liderancas.length} | Reuniões: {reunioes.length}</p>
        </div>
      </div>


      {showConfig && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: 20, fontSize: 18, fontWeight: 700 }}>⚙️ Configurações do Candidato</h3>
            {[
              { label: 'Nome', key: 'nome' },
              { label: 'Cargo', key: 'cargo' },
              { label: 'Estado', key: 'estado' },
              { label: 'Bairro de atuação', key: 'bairro' },
              { label: 'Endereço', key: 'endereco' },
              { label: 'Instagram (URL)', key: 'instagram' },
              ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input value={config[f.key] || ''} onChange={e => setConfig({...config, [f.key]: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }}>Foto do candidato</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {config.foto_url ? (
                  <img src={config.foto_url} alt="Foto" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fbbf24', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1e40af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>{(config.nome || 'D')[0].toUpperCase()}</div>
                )}
                <label style={{ padding: '10px 14px', background: '#334155', color: '#f1f5f9', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {fotoSubindo ? '⏳ Enviando...' : '📷 Escolher imagem'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={fotoSubindo}
                    onChange={async e => {
                      const arquivo = e.target.files?.[0];
                      if (!arquivo) return;
                      if (arquivo.size > 5 * 1024 * 1024) { alert('Imagem muito grande (máx. 5MB).'); return; }
                      setFotoSubindo(true);
                      const ext = arquivo.name.split('.').pop().toLowerCase();
                      const caminho = `perfil/foto-candidato-${Date.now()}.${ext}`;
                      const { error } = await supabase.storage.from('midias-campanha').upload(caminho, arquivo, { upsert: true });
                      if (error) { alert('Erro ao enviar imagem: ' + error.message); }
                      else {
                        const { data } = supabase.storage.from('midias-campanha').getPublicUrl(caminho);
                        setConfig(c => ({ ...c, foto_url: data.publicUrl }));
                      }
                      setFotoSubindo(false);
                    }} />
                </label>
                {config.foto_url && (
                  <button onClick={() => setConfig(c => ({ ...c, foto_url: null }))} style={{ padding: '10px 14px', background: 'transparent', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Remover</button>
                )}
              </div>
              <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>A foto só é aplicada após clicar em 💾 Salvar.</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }}>Bairro no mapa</label>
              <select value={config.bairro || ''} onChange={e => {
                const b = e.target.value;
                const coords = COORDS_BAIRROS[b];
                setConfig({...config, bairro: b, latitude: coords ? coords[0] : config.latitude, longitude: coords ? coords[1] : config.longitude});
              }} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }}>
                <option value="">Selecione o bairro...</option>
                {Object.keys(COORDS_BAIRROS).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {config.latitude && <p style={{ color: '#60a5fa', fontSize: 11, marginTop: 4 }}>📍 Coordenadas: {config.latitude}, {config.longitude}</p>}
            </div>
            {ehMaster && (
              <div style={{ marginTop: 16, padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}>
                <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px' }}>CANDIDATO DE ANÁLISE (TSE)</p>
                {analiseCand
                  ? <p style={{ color: '#f1f5f9', fontSize: 13, margin: 0 }}>{analiseCand.nome} · {analiseCand.cargo} · {analiseCand.ano} · {analiseCand.total?.toLocaleString('pt-BR')} votos</p>
                  : <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Nenhum candidato importado. Rode o script de importação no onboarding.</p>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={salvarConfig} style={{ flex: 1, padding: 12, background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>💾 Salvar</button>
              <button onClick={() => setShowConfig(false)} style={{ flex: 1, padding: 12, background: '#334155', color: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {/* Botões principais */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <InstalarAppButton />
        <PendingBadge />
        {[
          { label: "⚙️ Config", onClick: () => setShowConfig(true), bg: "#0f172a" },
          ...(ehMaster ? [{ label: "👥 Usuários", onClick: () => setAba("admins") }] : []),
          { label: "+ Apoiador",        onClick: () => setShowEleitor(true) },
          { label: "+ Liderança",      onClick: () => setShowLider(true)   },
          { label: "+ Reunião",        onClick: () => setShowReuniao(true) },
          { label: "Mapa",             onClick: () => setAba("mapa")       },
          { label: "🗂️ Demandas",      onClick: () => setAba("demandas")   },
          { label: "Anotações",        onClick: () => setAba("anotacoes")  },
          { label: "Mídias",           onClick: () => setAba("midias")     },
          { label: "Analytics",        onClick: () => setAba("analytics")  },
          { label: "🏆 Ranking", onClick: () => setAba("ranking") },
          { label: "Cenário Político", onClick: () => setAba("cenario")    },
          { label: "🖨️ Relatórios", onClick: () => setAba("relatorios") },
          { label: "Diagnostico Eleitoral", onClick: () => setAba("diagnostico") },
          { label: "Mapa Eleitoral TSE", onClick: () => setAba("mapaeleitoral") },
          { label: "Analise Territorial", onClick: () => setAba("analise") },
          { label: "Radar Oportunidade", onClick: () => setAba("radar") },
          { label: "Caminho da Vitoria", onClick: () => setAba("caminho") },
          { label: "Projecao 2026", onClick: () => setAba("projecao") },
          { label: "🏛️ Cenario Municipal", onClick: () => setAba("cenario-municipal") },
        ].map((b, i) => (
          <button key={i} onClick={b.onClick} style={{
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 8, color: "#f1f5f9", padding: "10px 18px",
            cursor: "pointer", fontWeight: 600, fontSize: 13,
            whiteSpace: "nowrap", transition: "background 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.background = "#334155"}
          onMouseOut={e => e.currentTarget.style.background = "#1e293b"}
          >{b.label}</button>
        ))}
      </div>

      {/* GRID LADO A LADO — 3 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', alignItems: 'start' }}>

        {/* Coluna Apoiadores */}
        <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1f2937" }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#60a5fa', marginBottom: '12px' }}>👥 Apoiadores ({eleitores.length})</h3>
          <input type="text" placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1f2937', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box', background: '#0a0f1c', color: '#f1f5f9' }} />
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eleitorFiltrados.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum apoiador.</p>
            ) : eleitorFiltrados.map(e => (
              <div key={e.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{e.nome}</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>📱 {e.telefone}</p>
                    {e.bairro && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {e.bairro}</p>}
                    {e.zona_eleitoral && <p style={{ color: '#94a3b8', fontSize: '11px' }}>🗳️ Zona {e.zona_eleitoral}{e.secao_eleitoral ? ` • Seção ${e.secao_eleitoral}` : ''}</p>}
                    {localDeVotacao(e.zona_eleitoral, e.secao_eleitoral) && <p style={{ color: '#94a3b8', fontSize: '11px' }}>🏫 {localDeVotacao(e.zona_eleitoral, e.secao_eleitoral)}</p>}
                    {e.observacao && <p title={e.observacao} style={{ marginTop: '4px', background: '#422006', color: '#fde68a', border: '1px solid #854d0e', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', lineHeight: '1.4' }}>💬 {e.observacao}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
                    {e.telefone && <a href={'https://wa.me/55' + e.telefone.replace(/\D/g,'') + '?text=' + encodeURIComponent('Ola ' + (e.nome ? e.nome.split(' ')[0] : '') + '! Aqui e a equipe do Deputado Demo. Estamos em contato para manter voce por dentro das novidades. Conte conosco!')} target="_blank" rel="noreferrer" style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', textDecoration: 'none' }}>📲</a>}
                    {e.telefone && <a href={'https://wa.me/55' + e.telefone.replace(/D/g,'') + '?text=SAIR'} target="_blank" rel="noreferrer" style={{ background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', textDecoration: 'none' }}>🚫</a>}
                    <button onClick={() => setEleitorEditando(e)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}>✏️</button><button onClick={() => excluir('eleitores', e.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Lideranças */}
        <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1f2937" }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#94a3b8', marginBottom: '12px' }}>🤝 Lideranças ({liderancas.length})</h3>
          <div style={{ maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {liderancas.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma liderança.</p>
            ) : liderancas.map(l => (
              <div key={l.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{l.nome}</p>
                    {l.telefone && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📱 {l.telefone}</p>}
                    {l.bairro && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {l.bairro}</p>}
                    {l.demanda && <p style={{ color: '#94a3b8', fontSize: '11px' }}>💬 {l.demanda}</p>}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText('https://gabinete-demo.vercel.app/#/cadastro/' + l.id); alert('Link copiado!'); }} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>🔗 Link</button><button onClick={() => abrirEditarLider(l)} style={{ background: '#fef9c3', color: '#a16207', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', flexShrink: 0, marginLeft: '6px' }}>✏️</button><button onClick={() => excluir('liderancas', l.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', flexShrink: 0, marginLeft: '6px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Reuniões */}
        <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1f2937" }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#60a5fa', marginBottom: '12px' }}>📅 Reuniões ({reunioes.length})</h3>
          <button onClick={() => setShowComunicado(true)}
            style={{ width: '100%', marginBottom: 12, padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            📣 Comunicado por liderança
          </button>
          <div style={{ maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reunioes.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma reunião.</p>
            ) : reunioes.map(r => (
              <div key={r.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{r.titulo}</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>📅 {r.data ? new Date(r.data).toLocaleString('pt-BR') : '—'}</p>
                    {r.local && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {r.local}</p>}
                    {linkMapaReuniao(r) && (
                      <a href={linkMapaReuniao(r)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', marginTop: 4, color: '#60a5fa', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📍 Abrir no mapa</a>
                    )}
                  </div>
                  <button onClick={() => excluir('reunioes', r.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', flexShrink: 0, marginLeft: '6px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <p className="text-center text-green-600 font-bold">✅ Conectado ao Supabase</p>

      {relatorio && <RelatorioImpressao {...relatorio} onFechar={() => setRelatorio(null)} />}
      {showComunicado && (
        <Comunicado eleitores={eleitores} liderancas={liderancas} reunioes={reunioes}
          onEnviar={({ lideranca, total }) => registrarLog('Enviou comunicado', `Liderança: ${lideranca} | ${total} destinatários`)}
          onClose={() => setShowComunicado(false)} />
      )}

      {/* MODAL ELEITOR */}

      {showMapaSelecao && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '600px', color: '#111827' }}>
            <h2 style={{ color: '#1e40af', marginBottom: '8px' }}>📍 Posicione no Mapa</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Arraste o marcador azul para o local exato do apoiador.</p>
            <div ref={mapaSelecaoRef} style={{ width: '100%', height: '350px', borderRadius: '12px', marginBottom: '16px' }} />
            {coordsManual && <p style={{ color: '#16a34a', fontSize: '13px', marginBottom: '12px' }}>📍 Lat: {coordsManual.latitude.toFixed(5)}, Lng: {coordsManual.longitude.toFixed(5)}</p>}
            <button onClick={() => {
              setNovoEleitor(prev => ({ ...prev, latitude: coordsManual?.latitude, longitude: coordsManual?.longitude }));
              setShowMapaSelecao(false);
              cadastrarEleitorComCoords(coordsManual);
            }} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
              ✅ Confirmar Localização e Salvar
            </button>
            <button onClick={() => setShowMapaSelecao(false)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {eleitorEditando && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setEleitorEditando(null)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#1e40af', marginBottom: '20px' }}>Editar Apoiador</h2>
            <input style={estiloInput} placeholder="Nome completo *" value={eleitorEditando.nome || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, nome: e.target.value })} />
            <input style={estiloInput} placeholder="Telefone / WhatsApp *" value={eleitorEditando.telefone || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, telefone: e.target.value })} />
            <select style={estiloInput} value={eleitorEditando.municipio || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, municipio: e.target.value })}>
              <option value="">Selecione o município...</option>
              {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input style={estiloInput} list="bairros-cand-edit-eleitor" autoComplete="off" placeholder="Bairro / comunidade" value={eleitorEditando.bairro || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, bairro: e.target.value })} />
            <datalist id="bairros-cand-edit-eleitor">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <input style={estiloInput} placeholder="Endereco completo" value={eleitorEditando.endereco || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, endereco: e.target.value })} />
            <select style={estiloInput} value={eleitorEditando.lideranca_id || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, lideranca_id: e.target.value })}>
              <option value="">Vincular Lideranca (opcional)</option>
              {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={eleitorEditando.zona_eleitoral || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Secao" value={eleitorEditando.secao_eleitoral || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, secao_eleitoral: e.target.value })} />
            </div>
            {localDeVotacao(eleitorEditando.zona_eleitoral, eleitorEditando.secao_eleitoral) && <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0' }}>🏫 {localDeVotacao(eleitorEditando.zona_eleitoral, eleitorEditando.secao_eleitoral)}</p>}
            <textarea style={{ ...estiloInput, resize: 'vertical' }} rows={3} placeholder="💬 Observação (ex.: telefone compartilhado pela família — mesmo número de [nome])" value={eleitorEditando.observacao || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, observacao: e.target.value })} />
            <button onClick={salvarEdicaoEleitor} disabled={loading} style={estiloBotao('#1d4ed8')}>{loading ? 'Salvando...' : 'Salvar Alteracoes'}</button>
            <button onClick={() => setEleitorEditando(null)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}
      {liderEditando && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setLiderEditando(null)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#a16207', marginBottom: '20px' }}>✏️ Editar Liderança</h2>
            <input style={estiloInput} placeholder="Nome *" value={liderEditando.nome || ''} onChange={e => setLiderEditando({ ...liderEditando, nome: e.target.value })} />
            <input style={estiloInput} placeholder="Telefone / WhatsApp" value={liderEditando.telefone || ''} onChange={e => setLiderEditando({ ...liderEditando, telefone: e.target.value })} />
            <select style={estiloInput} value={liderEditando.municipio || ''} onChange={e => setLiderEditando({ ...liderEditando, municipio: e.target.value })}>
              <option value="">Selecione o município...</option>
              {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input style={estiloInput} list="bairros-cand-edit-lider" autoComplete="off" placeholder="Bairro / comunidade" value={liderEditando.bairro || ''} onChange={e => setLiderEditando({ ...liderEditando, bairro: e.target.value })} />
            <datalist id="bairros-cand-edit-lider">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <input style={estiloInput} placeholder="Endereço completo" value={liderEditando.endereco || ''} onChange={e => setLiderEditando({ ...liderEditando, endereco: e.target.value })} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={liderEditando.zona_eleitoral || ''} onChange={e => setLiderEditando({ ...liderEditando, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Seção" value={liderEditando.secao_eleitoral || ''} onChange={e => setLiderEditando({ ...liderEditando, secao_eleitoral: e.target.value })} />
            </div>
            <textarea style={{ ...estiloInput, resize: 'vertical' }} placeholder="Demanda / Observação" rows={3} value={liderEditando.demanda || ''} onChange={e => setLiderEditando({ ...liderEditando, demanda: e.target.value })} />
            <button onClick={salvarEdicaoLider} disabled={loading} style={estiloBotao('#a16207')}>{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
            <button onClick={() => setLiderEditando(null)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}
      {showEleitor && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowEleitor(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#1e40af', marginBottom: '20px' }}>➕ Cadastrar Apoiador</h2>
            <input style={estiloInput} placeholder="Nome completo *" value={novoEleitor.nome} onChange={e => setNovoEleitor({ ...novoEleitor, nome: e.target.value })} />
            <input style={estiloInput} placeholder="Telefone / WhatsApp *" value={novoEleitor.telefone} onChange={e => setNovoEleitor({ ...novoEleitor, telefone: e.target.value })} />
            <select style={estiloInput} value={novoEleitor.municipio} onChange={e => setNovoEleitor({ ...novoEleitor, municipio: e.target.value, bairro: '' })}>
              <option value="">Selecione o município...</option>
              {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input style={estiloInput} list="bairros-cand-eleitor" autoComplete="off" placeholder="Bairro / comunidade *" value={novoEleitor.bairro} onChange={e => setNovoEleitor({ ...novoEleitor, bairro: e.target.value })} />
            <datalist id="bairros-cand-eleitor">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <input style={estiloInput} placeholder="Endereço completo *" value={novoEleitor.endereco} onChange={e => setNovoEleitor({ ...novoEleitor, endereco: e.target.value })} />
            <select style={estiloInput} value={novoEleitor.lideranca_id} onChange={e => setNovoEleitor({...novoEleitor, lideranca_id: e.target.value})}>
                <option value="">👥 Vincular Liderança (opcional)</option>
                {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={novoEleitor.zona_eleitoral} onChange={e => setNovoEleitor({ ...novoEleitor, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Seção" min="1" max="9999" value={novoEleitor.secao_eleitoral} onChange={e => setNovoEleitor({ ...novoEleitor, secao_eleitoral: e.target.value })} />
            </div>
            {localDeVotacao(novoEleitor.zona_eleitoral, novoEleitor.secao_eleitoral) && <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0' }}>🏫 {localDeVotacao(novoEleitor.zona_eleitoral, novoEleitor.secao_eleitoral)}</p>}
            <textarea style={{ ...estiloInput, resize: 'vertical' }} rows={3} placeholder="💬 Observação (ex.: telefone compartilhado pela família — mesmo número de [nome])" value={novoEleitor.observacao || ''} onChange={e => setNovoEleitor({ ...novoEleitor, observacao: e.target.value })} />
                        <TermoLGPD aceito={termoAceito} onChange={setTermoAceito} />
            <button onClick={cadastrarEleitor} disabled={loading} style={estiloBotao('#16a34a')}>{loading ? 'Salvando...' : '✅ Cadastrar Apoiador'}</button>
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
            <input style={estiloInput} placeholder="Telefone / WhatsApp" value={novaLider.telefone} onChange={e => setNovaLider({ ...novaLider, telefone: e.target.value })} />
            <select style={estiloInput} value={novaLider.municipio} onChange={e => setNovaLider({ ...novaLider, municipio: e.target.value, bairro: '' })}>
              <option value="">Selecione o município...</option>
              {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input style={estiloInput} list="bairros-cand-lider" autoComplete="off" placeholder="Bairro / comunidade" value={novaLider.bairro} onChange={e => setNovaLider({ ...novaLider, bairro: e.target.value })} />
            <datalist id="bairros-cand-lider">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={novaLider.zona_eleitoral} onChange={e => setNovaLider({ ...novaLider, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Seção" min="1" max="9999" value={novaLider.secao_eleitoral} onChange={e => setNovaLider({ ...novaLider, secao_eleitoral: e.target.value })} />
            </div>
            <input style={estiloInput} placeholder="Endereço" value={novaLider.endereco} onChange={e => setNovaLider({ ...novaLider, endereco: e.target.value })} />
            <textarea style={{ ...estiloInput, resize: 'vertical' }} placeholder="Demanda / Observação" rows={3} value={novaLider.demanda} onChange={e => setNovaLider({ ...novaLider, demanda: e.target.value })} />
            <button onClick={cadastrarLider} disabled={loading} style={estiloBotao('#7c3aed')}>{loading ? 'Salvando...' : '✅ Cadastrar Liderança'}</button>
            <button onClick={() => setShowLider(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {aba === 'cenario' && <CenarioPolitico onVoltar={() => setAba(null)} />}
      {aba === 'midias' && <GestaoMidias onVoltar={() => setAba(null)} />}
      {aba === 'analytics' && <AnalyticsMidias onVoltar={() => setAba(null)} />}

      {aba === 'cenario-vereador' && <CenarioVereador2024 onVoltar={() => setAba(null)} />}

      {/* MODAL REUNIÃO */}
      {showReuniao && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setShowReuniao(false)}>
          <div style={estiloCard}>
            <h2 style={{ color: '#d97706', marginBottom: '20px' }}>➕ Agendar Reunião</h2>
            <input style={estiloInput} placeholder="Título *" value={novaReuniao.titulo} onChange={e => setNovaReuniao({ ...novaReuniao, titulo: e.target.value })} />
            <input style={estiloInput} type="datetime-local" value={novaReuniao.data} onChange={e => setNovaReuniao({ ...novaReuniao, data: e.target.value })} />
            <input style={estiloInput} placeholder="Local (ex: Câmara)" value={novaReuniao.local} onChange={e => setNovaReuniao({ ...novaReuniao, local: e.target.value })} />
            <input style={estiloInput} placeholder="Endereço completo" value={novaReuniao.endereco} onChange={e => setNovaReuniao({ ...novaReuniao, endereco: e.target.value })} />
            <button onClick={cadastrarReuniao} disabled={loading} style={estiloBotao('#d97706')}>{loading ? 'Salvando...' : '✅ Agendar Reunião'}</button>
            <button onClick={() => setShowReuniao(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

    </div>
  );
}





