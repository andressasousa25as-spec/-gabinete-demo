import { useState } from 'react';
import { ELEITORES, LIDERANCAS, REUNIOES, METRICAS } from '../dados';
import MapaDemo from './MapaDemo';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FiaW5ldGVkaWdpdGFsc2YiLCJhIjoiY21wb3o3cjBjMDY1djJzcHZyOXM4Y3JmZSJ9.S1a4VYKtkm_2Bn3Hxowugw';

export default function Dashboard({ candidato, onLogout }) {
  const [aba, setAba] = useState('inicio');
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(candidato);
  const [nomeAtual, setNomeAtual] = useState(candidato);

  const abas = [
    { id: 'inicio', label: '🏠 Início' },
    { id: 'eleitores', label: '👥 Eleitores' },
    { id: 'liderancas', label: '🤝 Lideranças' },
    { id: 'reunioes', label: '📅 Reuniões' },
    { id: 'mapa', label: '🗺️ Mapa' },
  ];

  const card = (titulo, valor, sub, cor) => (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: `1px solid ${cor}33` }}>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>{titulo}</p>
      <p style={{ color: cor, fontSize: 32, fontWeight: 800 }}>{valor}</p>
      <p style={{ color: '#64748b', fontSize: 12 }}>{sub}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      {/* Header */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>GABINETE DIGITAL</h1>
          {editandoNome ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                value={nomeEdit}
                onChange={e => setNomeEdit(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #3b82f6', background: '#1e293b', color: 'white', fontSize: 14 }}
              />
              <button onClick={() => { setNomeAtual(nomeEdit); setEditandoNome(false); }}
                style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>✓</button>
              <button onClick={() => setEditandoNome(false)}
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>✗</button>
            </div>
          ) : (
            <p style={{ color: '#60a5fa', fontSize: 14, margin: '4px 0 0', cursor: 'pointer' }} onClick={() => setEditandoNome(true)}>
              👑 {nomeAtual} <span style={{ fontSize: 11, color: '#64748b' }}>✏️ editar</span>
            </p>
          )}
        </div>
        <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
          Sair
        </button>
      </header>

      {/* Navegação */}
      <nav style={{ background: '#1e293b', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: '14px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            background: aba === a.id ? '#0f172a' : 'transparent',
            color: aba === a.id ? '#60a5fa' : '#94a3b8',
            borderBottom: aba === a.id ? '2px solid #3b82f6' : '2px solid transparent',
          }}>{a.label}</button>
        ))}
      </nav>

      {/* Conteúdo */}
      <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* INÍCIO */}
        {aba === 'inicio' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 20 }}>📊 Painel Geral</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {card('Total de Eleitores', METRICAS.totalEleitores.toLocaleString(), `Meta: ${METRICAS.metaEleitores.toLocaleString()}`, '#60a5fa')}
              {card('Lideranças Ativas', METRICAS.totalLiderancas, `Meta: ${METRICAS.metaLiderancas}`, '#f59e0b')}
              {card('Reuniões Realizadas', METRICAS.reunioesRealizadas, `${METRICAS.reunioesAgendadas} agendadas`, '#34d399')}
              {card('Bairros Cobertos', METRICAS.bairrosCobertos, 'em Macapá', '#a78bfa')}
            </div>

            <h3 style={{ fontSize: 16, color: '#94a3b8', marginBottom: 12 }}>📅 Próximas Reuniões</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REUNIOES.filter(r => r.status === 'agendada').map(r => (
                <div key={r.id} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{r.titulo}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>📍 {r.local}</p>
                  </div>
                  <span style={{ background: '#1e40af', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                    {new Date(r.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ELEITORES */}
        {aba === 'eleitores' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 20 }}>👥 Eleitores Cadastrados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ELEITORES.map(e => (
                <div key={e.id} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{e.nome}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '2px 0 0' }}>📍 {e.bairro} — Zona {e.zona} Seção {e.secao}</p>
                  </div>
                  <a href={`https://wa.me/55${e.telefone}`} target="_blank" rel="noreferrer"
                    style={{ background: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
                    📲 WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIDERANÇAS */}
        {aba === 'liderancas' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 20 }}>🤝 Lideranças</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {LIDERANCAS.map(l => (
                <div key={l.id} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #dc262633' }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#f87171', margin: '0 0 8px' }}>🔴 {l.nome}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0' }}>📍 {l.bairro}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0' }}>👥 {l.eleitores} eleitores vinculados</p>
                  <p style={{ color: '#fbbf24', fontSize: 13, margin: '8px 0 0' }}>💬 {l.demanda}</p>
                  <a href={`https://wa.me/55${l.telefone}`} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 12, background: '#16a34a', color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
                    📲 Contatar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REUNIÕES */}
        {aba === 'reunioes' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 20 }}>📅 Agenda de Reuniões</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REUNIOES.map(r => (
                <div key={r.id} style={{ background: '#1e293b', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{r.titulo}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>📍 {r.local} — {new Date(r.data).toLocaleString('pt-BR')}</p>
                  </div>
                  <span style={{
                    background: r.status === 'realizada' ? '#16a34a' : '#1e40af',
                    color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
                  }}>
                    {r.status === 'realizada' ? '✅ Realizada' : '🗓️ Agendada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAPA */}
        {aba === 'mapa' && <MapaDemo token={MAPBOX_TOKEN} candidato={nomeAtual} />}

      </main>
    </div>
  );
}
