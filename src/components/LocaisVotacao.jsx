import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Mapa simples via OpenStreetMap embed (sem token necessario)
function MapaLocais({ locais }) {
  const comCoordenadas = locais.filter(l => l.latitude && l.longitude);
  if (comCoordenadas.length === 0) return null;

  // Centro do mapa: media das coordenadas
  const lat = comCoordenadas.reduce((s, l) => s + Number(l.latitude), 0) / comCoordenadas.length;
  const lng = comCoordenadas.reduce((s, l) => s + Number(l.longitude), 0) / comCoordenadas.length;

  // Gerar marcadores para URL do uMap/OpenStreetMap nao funciona bem inline
  // Usar iframe do Google Maps embed com multiplos pins via query
  const pins = comCoordenadas.slice(0, 20).map(l => `${l.latitude},${l.longitude}`).join('|');
  const center = `${lat},${lng}`;

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b', marginBottom: 20 }}>
      <iframe
        title="Mapa Locais de Votacao"
        width="100%"
        height="350"
        frameBorder="0"
        style={{ display: 'block' }}
        src={`https://maps.google.com/maps?q=${encodeURIComponent(comCoordenadas[0].nome + ' ' + (comCoordenadas[0].endereco || '') + ' Macapa AP')}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
        allowFullScreen
      />
    </div>
  );
}

// Modal de cadastro/edicao
function ModalLocal({ local, onFechar, onSalvo }) {
  const editando = !!local?.id;
  const [dados, setDados] = useState({
    nome: local?.nome || '',
    endereco: local?.endereco || '',
    bairro: local?.bairro || '',
    municipio: local?.municipio || 'Macapá',
    zona: local?.zona || '',
    secoes: local?.secoes || '',
    latitude: local?.latitude || '',
    longitude: local?.longitude || '',
    fonte: local?.fonte || 'manual',
    observacao: local?.observacao || '',
  });
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!dados.nome.trim()) { alert('Nome do local e obrigatorio'); return; }
    try {
      setSalvando(true);
      const payload = {
        ...dados,
        latitude: dados.latitude ? Number(dados.latitude) : null,
        longitude: dados.longitude ? Number(dados.longitude) : null,
      };
      if (editando) {
        const { error } = await supabase.from('locais_votacao').update(payload).eq('id', local.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('locais_votacao').insert([payload]);
        if (error) throw error;
      }
      onSalvo();
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const inp = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1px solid #334155', background: '#0f172a',
    color: '#f1f5f9', fontSize: 13, marginBottom: 10,
    boxSizing: 'border-box',
  };
  const label = { color: '#94a3b8', fontSize: 12, marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#60a5fa', marginBottom: 20, fontSize: 16, fontWeight: 800 }}>
          {editando ? 'Editar Local' : '+ Novo Local de Votacao'}
        </h3>

        <label style={label}>Nome do local *</label>
        <input style={inp} placeholder="Ex: Escola Estadual Joao XXIII" value={dados.nome} onChange={e => setDados(p => ({ ...p, nome: e.target.value }))} />

        <label style={label}>Endereco</label>
        <input style={inp} placeholder="Rua, numero, complemento" value={dados.endereco} onChange={e => setDados(p => ({ ...p, endereco: e.target.value }))} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={label}>Bairro</label>
            <input style={inp} placeholder="Bairro" value={dados.bairro} onChange={e => setDados(p => ({ ...p, bairro: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Municipio</label>
            <input style={inp} placeholder="Macapa" value={dados.municipio} onChange={e => setDados(p => ({ ...p, municipio: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={label}>Zona eleitoral</label>
            <input style={inp} placeholder="Ex: 10" value={dados.zona} onChange={e => setDados(p => ({ ...p, zona: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Secoes</label>
            <input style={inp} placeholder="Ex: 0001, 0002, 0003" value={dados.secoes} onChange={e => setDados(p => ({ ...p, secoes: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={label}>Latitude</label>
            <input style={inp} placeholder="-0.034934" value={dados.latitude} onChange={e => setDados(p => ({ ...p, latitude: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Longitude</label>
            <input style={inp} placeholder="-51.066667" value={dados.longitude} onChange={e => setDados(p => ({ ...p, longitude: e.target.value }))} />
          </div>
        </div>

        <label style={label}>Fonte</label>
        <select style={{ ...inp, marginBottom: 10 }} value={dados.fonte} onChange={e => setDados(p => ({ ...p, fonte: e.target.value }))}>
          <option value="manual">Manual</option>
          <option value="tse">TSE</option>
        </select>

        <label style={label}>Observacao</label>
        <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Observacoes adicionais..." value={dados.observacao} onChange={e => setDados(p => ({ ...p, observacao: e.target.value }))} />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={salvar} disabled={salvando} style={{ flex: 1, padding: '10px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onFechar} style={{ flex: 1, padding: '10px', background: '#374151', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function LocaisVotacao({ onVoltar, perfil }) {
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [localEditando, setLocalEditando] = useState(null);
  const [aba, setAba] = useState('lista'); // 'lista' | 'mapa' | 'apoiadores'
  const [eleitores, setEleitores] = useState([]);
  const [localSel, setLocalSel] = useState(null);

  const podeEditar = perfil === 'candidato' || perfil === 'adm';

  const carregar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locais_votacao')
        .select('*')
        .order('zona', { ascending: true })
        .order('nome', { ascending: true });
      if (error) throw error;
      setLocais(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); carregarEleitores(); }, []);

  const carregarEleitores = async () => {
    const { data } = await supabase
      .from('eleitores')
      .select('id, nome, telefone, zona_eleitoral, secao_eleitoral, bairro');
    setEleitores(data || []);
  };

  // Cruzar eleitor com local: zona igual E secao contida na string de secoes
  const eleitoresdoLocal = (local) => {
    if (!local) return [];
    return eleitores.filter(e => {
      if (!e.zona_eleitoral || !e.secao_eleitoral) return false;
      const mesmaZona = String(e.zona_eleitoral) === String(local.zona);
      const secaoFormatada = String(e.secao_eleitoral).padStart(4, '0');
      const secaoNaLista = local.secoes && local.secoes.split(',').map(s => s.trim()).includes(secaoFormatada);
      return mesmaZona && secaoNaLista;
    });
  };

  const excluir = async (id) => {
    if (!confirm('Excluir este local?')) return;
    await supabase.from('locais_votacao').delete().eq('id', id);
    carregar();
  };

  // Zonas unicas para filtro
  const zonas = [...new Set(locais.map(l => l.zona).filter(Boolean))].sort();

  const locaisFiltrados = locais.filter(l => {
    const texto = busca.toLowerCase();
    const matchBusca = !busca || l.nome?.toLowerCase().includes(texto) || l.bairro?.toLowerCase().includes(texto) || l.endereco?.toLowerCase().includes(texto) || l.secoes?.includes(texto);
    const matchZona = !filtroZona || l.zona === filtroZona;
    return matchBusca && matchZona;
  });

  const s = {
    container: { minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24 },
    voltarBtn: { marginBottom: 20, padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },
    titulo: { fontSize: 22, fontWeight: 800, color: '#60a5fa', marginBottom: 20 },
    card: { background: '#1a2332', borderRadius: 10, padding: '12px 16px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    badge: (cor) => ({ background: cor + '22', color: cor, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }),
    tab: (ativo) => ({ padding: '8px 20px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: ativo ? '#1e293b' : 'transparent', color: ativo ? '#60a5fa' : '#94a3b8', borderBottom: ativo ? '2px solid #3b82f6' : '2px solid transparent' }),
  };

  return (
    <div style={s.container}>
      <button onClick={onVoltar} style={s.voltarBtn}>&#8592; Voltar</button>

      <h2 style={s.titulo}>Locais de Votacao <span style={{fontSize:14,color:'#64748b',fontWeight:400}}>({locais.length} locais)</span></h2>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1e293b', marginBottom: 20 }}>
        <button style={s.tab(aba === 'lista')} onClick={() => setAba('lista')}>&#x1F4CB; Lista</button>
        <button style={s.tab(aba === 'apoiadores')} onClick={() => setAba('apoiadores')}>&#x1F465; Apoiadores</button>
      </div>

      {/* Filtros e cadastro */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nome, bairro, secao..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0a0f1c', color: '#f1f5f9', fontSize: 13 }}
        />
        <select
          value={filtroZona}
          onChange={e => setFiltroZona(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0a0f1c', color: '#f1f5f9', fontSize: 13 }}
        >
          <option value="">Todas as zonas</option>
          {zonas.map(z => <option key={z} value={z}>Zona {z}</option>)}
        </select>
        {podeEditar && (
          <button
            onClick={() => { setLocalEditando(null); setModalAberto(true); }}
            style={{ padding: '8px 18px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}
          >
            + Novo Local
          </button>
        )}
      </div>



      {/* Aba Lista */}
      {aba === 'lista' && (
        loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : locaisFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>&#x1F3EB;</p>
            <p style={{ fontSize: 15 }}>Nenhum local encontrado.</p>
            {podeEditar && <p style={{ fontSize: 13 }}>Clique em "+ Novo Local" para cadastrar.</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locaisFiltrados.map(l => (
              <div key={l.id} style={s.card}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', margin: 0 }}>{l.nome}</p>
                    {l.zona && <span style={s.badge('#3b82f6')}>Zona {l.zona}</span>}
                    {l.fonte === 'tse' && <span style={s.badge('#10b981')}>TSE</span>}
                  </div>
                  {l.endereco && <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>&#x1F4CD; {l.endereco}{l.bairro ? ' — ' + l.bairro : ''}</p>}
                  {l.secoes && <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0' }}>Secoes: {l.secoes}</p>}
                  
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {l.latitude && l.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 6, padding: '4px 8px', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}
                    >
                      Maps
                    </a>
                  )}
                  {podeEditar && (
                    <>
                      <button onClick={() => { setLocalEditando(l); setModalAberto(true); }} style={{ background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Editar</button>
                      <button onClick={() => excluir(l.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Excluir</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Aba Apoiadores */}
      {aba === 'apoiadores' && (
        <div>
          {/* Se um local estiver selecionado, mostra detalhes */}
          {localSel ? (
            <div>
              <button onClick={() => setLocalSel(null)} style={{ marginBottom: 16, padding: '8px 16px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                &#8592; Voltar para lista
              </button>
              <div style={{ background: '#1a2332', borderRadius: 12, padding: '16px 20px', marginBottom: 16, border: '1px solid #1e293b' }}>
                <p style={{ fontWeight: 800, color: '#60a5fa', fontSize: 15, margin: '0 0 4px' }}>{localSel.nome}</p>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Zona {localSel.zona} — Secoes: {localSel.secoes}</p>
              </div>
              {(() => {
                const apoiadores = eleitoresdoLocal(localSel);
                return apoiadores.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Nenhum apoiador cadastrado neste local.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{apoiadores.length} apoiador(es) cadastrado(s)</p>
                    {apoiadores.map(e => (
                      <div key={e.id} style={{ background: '#1a2332', borderRadius: 8, padding: '10px 14px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13, margin: '0 0 2px' }}>{e.nome}</p>
                          <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Secao {e.secao_eleitoral}{e.bairro ? ' — ' + e.bairro : ''}</p>
                        </div>
                        {e.telefone && (
                          <a href={'https://wa.me/55' + e.telefone.replace(/\D/g, '')} target="_blank" rel="noreferrer"
                            style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 6, padding: '4px 8px', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                            WA
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Lista de locais com contagem de apoiadores */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                Clique em um local para ver os apoiadores cadastrados naquelas secoes.
              </p>
              {locaisFiltrados.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Nenhum local encontrado.</p>
              ) : locaisFiltrados.map(l => {
                const count = eleitoresdoLocal(l).length;
                return (
                  <div key={l.id} onClick={() => setLocalSel(l)}
                    style={{ background: '#1a2332', borderRadius: 10, padding: '12px 16px', border: '1px solid ' + (count > 0 ? '#3b82f6' : '#1e293b'), cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14, margin: '0 0 4px' }}>{l.nome}</p>
                      <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Zona {l.zona} — {l.municipio}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: count > 0 ? '#3b82f6' : '#334155', margin: 0 }}>{count}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>apoiador(es)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <ModalLocal
          local={localEditando}
          onFechar={() => { setModalAberto(false); setLocalEditando(null); }}
          onSalvo={() => { setModalAberto(false); setLocalEditando(null); carregar(); }}
        />
      )}
    </div>
  );
}
