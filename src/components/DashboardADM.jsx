import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import GestaoAnotacoes from '../GestaoAnotacoes';
import GestaoMidias from '../GestaoMidias';
import AnalyticsMidias from '../AnalyticsMidias';
import MapaPage from '../MapaPage';
import TermoLGPD from '../TermoLGPD';
import { registrarLog as logBase } from '../lib/logAtividade';
import { coordConfiavel, MACAPA_CENTRO, AMAPA_BBOX, LISTA_BAIRROS, LISTA_MUNICIPIOS } from '../lib/bairros';
import Comunicado from './Comunicado';
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

const ZONAS_AMAPA = ["1", "2", "4", "5", "6", "7", "8", "10", "11", "12"]; // zonas reais do AP (fonte: TSE)

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

const LIDERANCA_ID = '9abe9897-068f-4dab-90eb-94d5ceb0a575';

export default function DashboardADM({ adm, perfil, onLogout }) {
  if (!adm) return <div style={{ minHeight: "100vh", background: "#0a0f1c", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#fff" }}>Carregando...</p></div>;
  const [eleitores, setEleitores] = useState([]);
  const [liderancas, setLiderancas] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [showComunicado, setShowComunicado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('inicio');
  const [busca, setBusca] = useState('');
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
  const [config, setConfig] = useState({ nome: 'Deputado Demo', cargo: 'Deputado Estadual', estado: 'AP' });

  useEffect(() => {
    const carregarConfig = async () => {
      const { data } = await supabase.from('config_candidato').select('*').limit(1).maybeSingle();
      if (data) setConfig(data);
    };
    carregarConfig();
    fetchAll();
  }, []);

  const registrarLog = (acao, detalhes) => logBase(perfil || adm, acao, detalhes);

  const fetchAll = async () => {
    const [e, l, r] = await Promise.all([
      supabase.from('eleitores').select('*').order('created_at', { ascending: false }),
      supabase.from('liderancas').select('*').order('created_at', { ascending: false }),
      supabase.from('reunioes').select('*').order('data', { ascending: false }),
    ]);
    if (e.data) setEleitores(e.data);
    if (l.data) setLiderancas(l.data);
    if (r.data) setReunioes(r.data);
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
      }
      await registrarLog('Cadastrou apoiador', `Nome: ${novoEleitor.nome} | Bairro: ${novoEleitor.bairro || '-'}`);
      alert('✅ Apoiador cadastrado!');
      fetchAll();
      setNovoEleitor({ nome: '', telefone: '', bairro: '', endereco: '', zona_eleitoral: '', secao_eleitoral: '', municipio: '' });
      setTermoAceito(false);
      setShowEleitor(false);
    } else alert('Erro: ' + error.message);
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
        nome: novaLider.nome, telefone: novaLider.telefone, bairro: novaLider.bairro, municipio: novaLider.municipio || null,
        endereco: novaLider.endereco, lideranca_id: nova.id, tags: ['liderança'],
        zona_eleitoral: novaLider.zona_eleitoral || null, secao_eleitoral: novaLider.secao_eleitoral || null,
        consentimento_lgpd: true, data_consentimento: new Date().toISOString(),
      });
      await registrarLog('Cadastrou liderança', `Nome: ${novaLider.nome} | Bairro: ${novaLider.bairro || '-'}`);
      alert('✅ Liderança salva!');
      fetchAll();
      setNovaLider({ nome: '', telefone: '', bairro: '', demanda: '', endereco: '', municipio: '', zona_eleitoral: '', secao_eleitoral: '' });
      setShowLider(false);
    } else alert('Erro: ' + error.message);
    setLoading(false);
  };

  const cadastrarReuniao = async () => {
    if (!novaReuniao.titulo || !novaReuniao.data) return alert('❌ Título e data obrigatórios.');
    setLoading(true);
    const { error } = await supabase.from('reunioes').insert([novaReuniao]);
    if (!error) {
      await registrarLog('Agendou reunião', `Título: ${novaReuniao.titulo} | Data: ${novaReuniao.data}`);
      alert('✅ Reunião agendada!');
      fetchAll();
      setNovaReuniao({ titulo: '', data: '', local: '', endereco: '' });
      setShowReuniao(false);
    } else alert('Erro: ' + error.message);
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

  const excluir = async (tabela, id, nome) => {
    if (!confirm('Excluir permanentemente?')) return;
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (!error) {
      await registrarLog(`Excluiu registro de ${tabela}`, `ID: ${id} | Nome: ${nome || '-'}`);
      fetchAll();
    } else alert('Erro: ' + error.message);
  };

  if (aba === 'mapa') return (
    <div>
      <button onClick={() => setAba('inicio')} style={{ margin: '20px', padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
      <MapaPage config={config} />
    </div>
  );
  if (aba === 'anotacoes') return <GestaoAnotacoes liderancaId={LIDERANCA_ID} onVoltar={() => setAba('inicio')} />;
  if (aba === 'midias') return <GestaoMidias onVoltar={() => setAba('inicio')} />;
  if (aba === 'analytics') return <AnalyticsMidias onVoltar={() => setAba('inicio')} />;

  const eleitorFiltrados = eleitores.filter(e =>
    e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.bairro?.toLowerCase().includes(busca.toLowerCase()) ||
    e.telefone?.includes(busca)
  );

  return (
    <div style={{ background: "#0a0f1c", minHeight: "100vh", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, fontFamily: "Inter, system-ui, sans-serif", color: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ background: "#ffffff", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, color: "#0f172a", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
          <div style={{ width: 'clamp(40px, 10vw, 60px)', height: 'clamp(40px, 10vw, 60px)', borderRadius: '50%', background: '#7c3aed', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 24, border: '3px solid #7c3aed' }}>
            {adm.nome[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(14px, 4vw, 22px)', fontWeight: 700, color: "#0f172a", wordBreak: 'break-word' }}>{adm.nome}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#7c3aed", fontWeight: 600 }}>👮 Administrador — Gabinete Demo</p>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Apoiadores: {eleitores.length} | Lideranças: {liderancas.length} | Reuniões: {reunioes.length}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0, alignSelf: 'flex-start' }}>
          Sair
        </button>
      </div>

      {/* Botões */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          { label: "+ Apoiador", onClick: () => setShowEleitor(true) },
          { label: "+ Liderança", onClick: () => setShowLider(true) },
          { label: "+ Reunião", onClick: () => setShowReuniao(true) },
          { label: "Mapa", onClick: () => setAba("mapa") },
          { label: "Anotações", onClick: () => setAba("anotacoes") },
          { label: "Mídias", onClick: () => setAba("midias") },
          { label: "Analytics", onClick: () => setAba("analytics") },
        ].map((b, i) => (
          <button key={i} onClick={b.onClick} style={{
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 8, color: "#f1f5f9", padding: "10px 18px",
            cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap"
          }}
          onMouseOver={e => e.currentTarget.style.background = "#334155"}
          onMouseOut={e => e.currentTarget.style.background = "#1e293b"}
          >{b.label}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>

        {/* Apoiadores */}
        <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1f2937" }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#60a5fa', marginBottom: '12px' }}>👥 Apoiadores ({eleitores.length})</h3>
          <input type="text" placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1f2937', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box', background: '#0a0f1c', color: '#f1f5f9' }} />
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eleitorFiltrados.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum apoiador.</p>
              : eleitorFiltrados.map(e => (
                <div key={e.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{e.nome}</p>
                      <p style={{ color: '#94a3b8', fontSize: '12px' }}>📱 {e.telefone}</p>
                      {e.bairro && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {e.bairro}</p>}
                      {localDeVotacao(e.zona_eleitoral, e.secao_eleitoral) && <p style={{ color: '#94a3b8', fontSize: '11px' }}>🏫 {localDeVotacao(e.zona_eleitoral, e.secao_eleitoral)}</p>}
                      {e.observacao && <p title={e.observacao} style={{ marginTop: '4px', background: '#422006', color: '#fde68a', border: '1px solid #854d0e', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', lineHeight: '1.4' }}>💬 {e.observacao}</p>}
                    </div>
                    <button onClick={() => setEleitorEditando(e)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}>✏️</button><button onClick={() => excluir('eleitores', e.id, e.nome)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Lideranças */}
        <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1f2937" }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#94a3b8', marginBottom: '12px' }}>🤝 Lideranças ({liderancas.length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {liderancas.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma liderança.</p>
              : liderancas.map(l => (
                <div key={l.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{l.nome}</p>
                      {l.telefone && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📱 {l.telefone}</p>}
                      {l.bairro && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {l.bairro}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => abrirEditarLider(l)} style={{ background: '#fef9c3', color: '#a16207', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                      <button onClick={() => excluir('liderancas', l.id, l.nome)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Reuniões */}
        <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1f2937" }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#60a5fa', marginBottom: '12px' }}>📅 Reuniões ({reunioes.length})</h3>
          <button onClick={() => setShowComunicado(true)}
            style={{ width: '100%', marginBottom: 12, padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            📣 Comunicado por liderança
          </button>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reunioes.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma reunião.</p>
              : reunioes.map(r => (
                <div key={r.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' }}>{r.titulo}</p>
                      <p style={{ color: '#94a3b8', fontSize: '12px' }}>📅 {r.data ? new Date(r.data).toLocaleString('pt-BR') : '—'}</p>
                      {r.local && <p style={{ color: '#94a3b8', fontSize: '12px' }}>📍 {r.local}</p>}
                      {linkMapaReuniao(r) && (
                        <a href={linkMapaReuniao(r)} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: 4, color: '#60a5fa', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📍 Abrir no mapa</a>
                      )}
                    </div>
                    <button onClick={() => excluir('reunioes', r.id, r.titulo)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal Apoiador */}

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
            <input style={estiloInput} list="bairros-adm-edit-eleitor" autoComplete="off" placeholder="Bairro / comunidade" value={eleitorEditando.bairro || ''} onChange={e => setEleitorEditando({ ...eleitorEditando, bairro: e.target.value })} />
            <datalist id="bairros-adm-edit-eleitor">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
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
            <input style={estiloInput} list="bairros-adm-edit-lider" autoComplete="off" placeholder="Bairro / comunidade" value={liderEditando.bairro || ''} onChange={e => setLiderEditando({ ...liderEditando, bairro: e.target.value })} />
            <datalist id="bairros-adm-edit-lider">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
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
            <input style={estiloInput} list="bairros-adm-eleitor" autoComplete="off" placeholder="Bairro / comunidade *" value={novoEleitor.bairro} onChange={e => setNovoEleitor({ ...novoEleitor, bairro: e.target.value })} />
            <datalist id="bairros-adm-eleitor">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
            <input style={estiloInput} placeholder="Endereço completo *" value={novoEleitor.endereco} onChange={e => setNovoEleitor({ ...novoEleitor, endereco: e.target.value })} />
            <select style={estiloInput} value={novoEleitor.lideranca_id} onChange={e => setNovoEleitor({ ...novoEleitor, lideranca_id: e.target.value })}>
              <option value="">👥 Vincular Liderança (opcional)</option>
              {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select style={{ ...estiloInput, flex: 1 }} value={novoEleitor.zona_eleitoral} onChange={e => setNovoEleitor({ ...novoEleitor, zona_eleitoral: e.target.value })}>
                <option value="">Zona...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
              <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Seção" value={novoEleitor.secao_eleitoral} onChange={e => setNovoEleitor({ ...novoEleitor, secao_eleitoral: e.target.value })} />
            </div>
            {localDeVotacao(novoEleitor.zona_eleitoral, novoEleitor.secao_eleitoral) && <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0' }}>🏫 {localDeVotacao(novoEleitor.zona_eleitoral, novoEleitor.secao_eleitoral)}</p>}
            <textarea style={{ ...estiloInput, resize: 'vertical' }} rows={3} placeholder="💬 Observação (ex.: telefone compartilhado pela família — mesmo número de [nome])" value={novoEleitor.observacao || ''} onChange={e => setNovoEleitor({ ...novoEleitor, observacao: e.target.value })} />
            <TermoLGPD aceito={termoAceito} onChange={setTermoAceito} />
            <button onClick={cadastrarEleitor} disabled={loading} style={estiloBotao('#16a34a')}>{loading ? 'Salvando...' : '✅ Cadastrar Apoiador'}</button>
            <button onClick={() => setShowEleitor(false)} style={estiloBotao('#64748b')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Liderança */}
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
            <input style={estiloInput} list="bairros-adm-lider" autoComplete="off" placeholder="Bairro / comunidade" value={novaLider.bairro} onChange={e => setNovaLider({ ...novaLider, bairro: e.target.value })} />
            <datalist id="bairros-adm-lider">{BAIRROS_AMAPA.map(b => <option key={b} value={b} />)}</datalist>
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

      {/* Modal Reunião */}
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

      {showComunicado && (
        <Comunicado eleitores={eleitores} liderancas={liderancas} reunioes={reunioes}
          onEnviar={({ lideranca, total }) => registrarLog('Enviou comunicado', `Liderança: ${lideranca} | ${total} destinatários`)}
          onClose={() => setShowComunicado(false)} />
      )}
    </div>
  );
}
