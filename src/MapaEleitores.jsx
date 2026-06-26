import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { coordConfiavel, MACAPA_CENTRO, AMAPA_BBOX } from './lib/bairros';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FiaW5ldGVkaWdpdGFsc2YiLCJhIjoiY21wb3o3cjBjMDY1djJzcHZyOXM4Y3JmZSJ9.S1a4VYKtkm_2Bn3Hxowugw';

// Geocodificação via Mapbox, ANCORADA em Macapá/Amapá (proximity + bbox) para
// reduzir erros. O resultado bruto ainda passa por validação (coordConfiavel)
// no chamador — se cair no rio/fora do bairro, usa o centro do bairro.
async function geocodificarEndereco(alvo) {
  const cidade = alvo.cidade || alvo.municipio || 'Macapá';
  const partes = [alvo.logradouro || alvo.endereco, alvo.bairro, cidade, 'Amapá', 'Brasil'].filter(Boolean);
  const query = encodeURIComponent(partes.join(', '));
  const prox = `${MACAPA_CENTRO.longitude},${MACAPA_CENTRO.latitude}`;
  const bbox = `${AMAPA_BBOX.lngMin},${AMAPA_BBOX.latMin},${AMAPA_BBOX.lngMax},${AMAPA_BBOX.latMax}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1&language=pt&proximity=${prox}&bbox=${bbox}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { latitude: lat, longitude: lng };
    }
  } catch (err) {
    console.warn('Geocodificacao falhou:', alvo.nome, err);
  }
  return null;
}

export default function MapaEleitores({ config }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [todosEleitores, setTodosEleitores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [geocodificando, setGeocodificando] = useState(false);
  const [bairros, setBairros] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [secoes, setSecoes] = useState([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroSecao, setFiltroSecao] = useState('');
  const [mapCarregado, setMapCarregado] = useState(false);

  // Carrega Mapbox GL JS dinamicamente
  useEffect(() => {
    if (window.mapboxgl) { setMapCarregado(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => setMapCarregado(true);
    document.head.appendChild(script);
  }, []);

  // Inicializa mapa
  useEffect(() => {
    if (!mapCarregado || !mapContainer.current || mapRef.current) return;
    window.mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-51.07, -0.035],
      zoom: 12,
    });
    mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-left');
  }, [mapCarregado]);

  // Carrega eleitores
  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      const { data, error } = await supabase.from('vw_mapa_eleitores').select('*');
      if (error) { console.error('Erro:', error); setCarregando(false); return; }

      const lista = (data || []).map(e => ({
        ...e,
        zona_eleitoral: e.zona_eleitoral != null ? String(e.zona_eleitoral) : null,
        secao_eleitoral: e.secao_eleitoral != null ? String(e.secao_eleitoral) : null,
      }));

      setBairros([...new Set(lista.map(e => e.bairro).filter(Boolean))].sort());
      setZonas([...new Set(lista.map(e => e.zona_eleitoral).filter(Boolean))].sort((a, b) => Number(a) - Number(b)));
      setSecoes([...new Set(lista.map(e => e.secao_eleitoral).filter(Boolean))].sort((a, b) => Number(a) - Number(b)));

      const semCoord = lista.filter(e => !e.latitude || !e.longitude);
      // Auto-correção: valida a coord JÁ guardada; se cair no rio/fora do bairro,
      // troca pelo centro do bairro e regrava no banco. Conserta dados ruins legados.
      const comCoord = lista.filter(e => e.latitude && e.longitude).map(e => {
        const atual = { latitude: Number(e.latitude), longitude: Number(e.longitude) };
        const validado = coordConfiavel(atual, e.bairro, e.municipio) || atual;
        const mudou = Math.abs(validado.latitude - atual.latitude) > 1e-5 || Math.abs(validado.longitude - atual.longitude) > 1e-5;
        if (mudou) {
          supabase.from('eleitores').update({ latitude: validado.latitude, longitude: validado.longitude }).eq('id', e.eleitor_id);
        }
        return { ...e, ...validado };
      });
      // Pin do deputado: usa a config recebida ou busca no banco (painéis como
      // o da Equipe abrem o mapa sem passar config — o deputado sumia lá).
      let cfg = config;
      if (!cfg || !cfg.latitude || !cfg.longitude) {
        const { data: cfgBanco } = await supabase.from('config_candidato').select('*').limit(1).maybeSingle();
        if (cfgBanco) cfg = cfgBanco;
      }
      const deputado = cfg && cfg.latitude && cfg.longitude ? [{
        eleitor_id: 'deputado', nome: cfg.nome || 'Deputado', bairro: cfg.bairro || '',
        latitude: cfg.latitude, longitude: cfg.longitude, tipo: 'deputado', lideranca: false
      }] : [];
      setTodosEleitores([...deputado, ...comCoord]);
      setCarregando(false);

      if (semCoord.length > 0) {
        setGeocodificando(true);
        for (const eleitor of semCoord) {
          await new Promise(r => setTimeout(r, 250));
          const bruto = await geocodificarEndereco(eleitor);
          // Rede de segurança: valida o ponto; se for suspeito (rio/fora do bairro),
          // usa o centro do bairro. Nunca grava uma coordenada absurda.
          const coords = coordConfiavel(bruto, eleitor.bairro, eleitor.municipio);
          if (coords) {
            const atualizado = { ...eleitor, ...coords };
            setTodosEleitores(prev => [...prev, atualizado]);
            await supabase.from('eleitores').update({ latitude: coords.latitude, longitude: coords.longitude }).eq('id', eleitor.eleitor_id);
          }
        }
        setGeocodificando(false);
      }
    };
    carregar();
  }, []);

  // Atualiza marcadores no mapa
  useEffect(() => {
    if (!mapRef.current || !mapCarregado) return;

    // Remove marcadores antigos
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtrados = todosEleitores.filter(e => {
      const matchNome = !buscaNome || e.nome?.toLowerCase().includes(buscaNome.toLowerCase());
      const matchBairro = !filtroBairro || e.bairro === filtroBairro;
      const matchZona = !filtroZona || e.zona_eleitoral === filtroZona;
      const matchSecao = !filtroSecao || e.secao_eleitoral === filtroSecao;
      return matchNome && matchBairro && matchZona && matchSecao && e.latitude && e.longitude;
    });

    // Pins no MESMO ponto (registros ancorados no centro do bairro) ficavam um
    // em cima do outro e só um aparecia. Espalha os repetidos num círculo de
    // ~50m ao redor do ponto — só na exibição, o banco não muda.
    const porPonto = {};
    filtrados.forEach(e => {
      const chave = `${Number(e.latitude).toFixed(5)},${Number(e.longitude).toFixed(5)}`;
      (porPonto[chave] = porPonto[chave] || []).push(e);
    });
    const exibidos = Object.values(porPonto).flatMap(grupo => {
      if (grupo.length === 1) return grupo;
      return grupo.map((e, i) => {
        const ang = (2 * Math.PI * i) / grupo.length;
        return {
          ...e,
          latitude: Number(e.latitude) + 0.00045 * Math.sin(ang),
          longitude: Number(e.longitude) + 0.00045 * Math.cos(ang),
        };
      });
    });

    exibidos.forEach(e => {
      const cor = e.tipo === 'deputado' ? '#d97706' : e.lideranca ? '#dc2626' : '#2563eb';
      const el = document.createElement('div');
      el.style.cssText = `width:22px;height:32px;cursor:pointer;`;
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 28 40"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${cor}" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`;

      const popup = new window.mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="min-width:180px;font-family:sans-serif">
          <strong style="font-size:14px;color:#1e40af">${e.nome}</strong>
          ${e.lideranca ? '<span style="margin-left:6px;background:#dc2626;color:white;font-size:10px;padding:2px 4px;border-radius:3px">LIDERANCA</span>' : ''}
          <hr style="margin:6px 0"/>
          <div><strong>Endereço:</strong> ${e.logradouro || '-'}</div>
          <div><strong>Bairro:</strong> ${e.bairro || '-'}</div>
          <div><strong>Cidade:</strong> ${e.cidade || e.municipio || '-'}</div>
          ${e.telefone ? `<div><strong>Telefone:</strong> ${e.telefone}</div>` : ''}
          <div><strong>Zona:</strong> ${e.zona_eleitoral || '-'}</div>
          <div><strong>Seção:</strong> ${e.secao_eleitoral || '-'}</div>
          ${!e.lideranca && e.lideranca_nome ? `<div style="margin-top:4px;color:#1e40af"><strong>Cadastrado por:</strong> ${e.lideranca_nome}</div>` : ''}
        </div>
      `);

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([e.longitude, e.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });

    // Enquadra todos os pontos visíveis (visão estadual automática)
    if (filtrados.length > 0) {
      const bounds = new window.mapboxgl.LngLatBounds();
      filtrados.forEach(e => bounds.extend([e.longitude, e.latitude]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 700 });
    }
  }, [todosEleitores, buscaNome, filtroBairro, filtroZona, filtroSecao, mapCarregado]);

  const secoesFiltradas = filtroZona
    ? [...new Set(todosEleitores.filter(e => e.zona_eleitoral === filtroZona).map(e => e.secao_eleitoral).filter(Boolean))].sort((a, b) => Number(a) - Number(b))
    : secoes;

  const totalVisiveis = todosEleitores.filter(e => {
    const matchNome = !buscaNome || e.nome?.toLowerCase().includes(buscaNome.toLowerCase());
    const matchBairro = !filtroBairro || e.bairro === filtroBairro;
    const matchZona = !filtroZona || e.zona_eleitoral === filtroZona;
    const matchSecao = !filtroSecao || e.secao_eleitoral === filtroSecao;
    return matchNome && matchBairro && matchZona && matchSecao && e.latitude && e.longitude;
  }).length;

  const sel = { padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', alignItems: 'center', color: 'var(--text)' }}>
        <span><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', display: 'inline-block', marginRight: 4 }}></span>Apoiador</span>
        <span><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626', display: 'inline-block', marginRight: 4 }}></span>Lideranca</span>
        <span><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#d97706', display: 'inline-block', marginRight: 4 }}></span>Deputado</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Buscar por nome..." value={buscaNome} onChange={e => setBuscaNome(e.target.value)} style={{ ...sel, minWidth: '180px' }} />
        <select value={filtroBairro} onChange={e => setFiltroBairro(e.target.value)} style={sel}>
          <option value="">Todos os Bairros</option>
          {bairros.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filtroZona} onChange={e => { setFiltroZona(e.target.value); setFiltroSecao(''); }} style={sel}>
          <option value="">Todas as Zonas</option>
          {zonas.map(z => <option key={z} value={z}>Zona {z}</option>)}
        </select>
        <select value={filtroSecao} onChange={e => setFiltroSecao(e.target.value)} style={sel}>
          <option value="">Todas as Secoes</option>
          {secoesFiltradas.map(s => <option key={s} value={s}>Secao {s}</option>)}
        </select>
        <div style={{ background: 'var(--surface-2)', color: 'var(--text)', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
          {carregando ? 'Carregando...' : `${totalVisiveis} no mapa${geocodificando ? ' - buscando coords...' : ''}`}
        </div>
        {(buscaNome || filtroBairro || filtroZona || filtroSecao) && (
          <button onClick={() => { setBuscaNome(''); setFiltroBairro(''); setFiltroZona(''); setFiltroSecao(''); }}
            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
            Limpar
          </button>
        )}
      </div>

      <div ref={mapContainer} style={{ height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }} />

    </div>
  );
}
