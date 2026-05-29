import { useEffect, useRef } from 'react';
import { ELEITORES, LIDERANCAS } from '../dados';

export default function MapaDemo({ token, candidato }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (window.mapboxgl) { initMap(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  function initMap() {
    if (mapRef.current) return;
    window.mapboxgl.accessToken = token;
    mapRef.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-51.07, 0.035],
      zoom: 12,
    });
    mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-left');
    mapRef.current.on('load', () => addMarkers());
  }

  function addMarkers() {
    const liderancaIds = LIDERANCAS.map(l => l.id);

    // Marcador do deputado
    const elDeputado = document.createElement('div');
    elDeputado.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 28 40"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#d97706" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`;
    new window.mapboxgl.Marker(elDeputado)
      .setLngLat([-51.0589, 0.0401])
      .setPopup(new window.mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="min-width:180px;font-family:sans-serif">
          <strong style="color:#d97706">👑 ${candidato}</strong>
          <hr style="margin:6px 0"/>
          <div>Jesus de Nazaré — Macapá</div>
        </div>
      `))
      .addTo(mapRef.current);

    // Eleitores
    ELEITORES.forEach(e => {
      const isLider = LIDERANCAS.some(l => l.nome.includes(e.nome.split(' ')[0]));
      const cor = isLider ? '#dc2626' : '#2563eb';
      const el = document.createElement('div');
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 28 40"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${cor}" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`;
      new window.mapboxgl.Marker(el)
        .setLngLat([e.longitude, e.latitude])
        .setPopup(new window.mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="min-width:180px;font-family:sans-serif">
            <strong style="color:#1e40af">${e.nome}</strong>
            <hr style="margin:6px 0"/>
            <div><strong>Bairro:</strong> ${e.bairro}</div>
            <div><strong>Zona:</strong> ${e.zona} — Seção: ${e.secao}</div>
          </div>
        `))
        .addTo(mapRef.current);
    });

    // Lideranças
    LIDERANCAS.forEach(l => {
      const eleitor = ELEITORES.find(e => e.lideranca_id === l.id);
      if (!eleitor) return;
      const el = document.createElement('div');
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#dc2626" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`;
      new window.mapboxgl.Marker(el)
        .setLngLat([eleitor.longitude + 0.002, eleitor.latitude + 0.002])
        .setPopup(new window.mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="min-width:180px;font-family:sans-serif">
            <strong style="color:#dc2626">🔴 LIDERANÇA</strong><br/>
            <strong>${l.nome}</strong>
            <hr style="margin:6px 0"/>
            <div>📍 ${l.bairro}</div>
            <div>👥 ${l.eleitores} eleitores</div>
            <div style="color:#f59e0b;margin-top:4px">💬 ${l.demanda}</div>
          </div>
        `))
        .addTo(mapRef.current);
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 12, color: 'white' }}>🗺️ Mapa de Eleitores</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, flexWrap: 'wrap' }}>
        <span><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#d97706', display: 'inline-block', marginRight: 4 }}></span>Candidato</span>
        <span><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626', display: 'inline-block', marginRight: 4 }}></span>Liderança</span>
        <span><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', display: 'inline-block', marginRight: 4 }}></span>Eleitor</span>
      </div>
      <div ref={mapContainer} style={{ height: 550, borderRadius: 16, overflow: 'hidden', border: '1px solid #1e293b' }} />
    </div>
  );
}
