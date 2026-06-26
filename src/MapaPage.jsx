import MapaEleitores from './MapaEleitores';

export default function MapaPage({ config }) {
  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg)' }}>
      <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', color: '#1e40af', marginBottom: '4px' }}>
            Mapa de Apoiadores
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Visualize a distribuicao geografica dos eleitores cadastrados
          </p>
        </div>
        <MapaEleitores config={config} />
      </div>
    </div>
  );
}
