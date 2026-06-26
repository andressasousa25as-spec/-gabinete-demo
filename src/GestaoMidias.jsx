import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function GestaoMidias({ onVoltar }) {
  const [midias, setMidias] = useState([]);
  const [eleitores, setEleitores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(null);
  const [midiaDisparo, setMidiaDisparo] = useState(null);
  const [selecionados, setSelecionados] = useState([]);
  const [listaLinks, setListaLinks] = useState([]);
  const [liderancas, setLiderancas] = useState([]);
  const [filtroLideranca, setFiltroLideranca] = useState('');
  const [grupoAlvo, setGrupoAlvo] = useState('apoiadores'); // apoiadores | liderancas

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: mData } = await supabase.from('midias').select('*').order('created_at', { ascending: false });
    setMidias(mData || []);
    const { data: eData } = await supabase
      .from('eleitores')
      .select('id, nome, telefone, bairro, lideranca_id')
      .not('telefone', 'is', null)
      .eq('opt_out', false);
    if (eData) setEleitores(eData);
    const { data: lData } = await supabase.from('liderancas').select('id, nome, telefone, bairro').order('nome');
    setLiderancas(lData || []);
    setLoading(false);
  };

  const handleArquivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArquivo(file);
    if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  };

  const detectarTipo = (file) => {
    if (file.type.startsWith('image/')) return 'imagem';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'outro';
  };

  const upload = async () => {
    setErro(''); setSucesso('');
    if (!titulo) return setErro('❌ Digite um título para a mídia.');
    if (!arquivo) return setErro('❌ Selecione um arquivo.');
    setUploading(true);
    try {
      const ext = arquivo.name.split('.').pop();
      const nomeArquivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `publico/${nomeArquivo}`;
      const { error: uploadError } = await supabase.storage.from('midias-campanha').upload(path, arquivo, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('midias-campanha').getPublicUrl(path);
      const { error: dbError } = await supabase.from('midias').insert({
        titulo, descricao, tipo: detectarTipo(arquivo),
        arquivo_url: urlData.publicUrl, arquivo_path: path,
        link_rastreavel: urlData.publicUrl,
      });
      if (dbError) throw dbError;
      setSucesso('✅ Mídia enviada com sucesso!');
      setTitulo(''); setDescricao(''); setArquivo(null); setPreview(null);
      fetchAll();
    } catch (err) {
      setErro('❌ Erro ao enviar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Lista de destinatários conforme o grupo escolhido (só os que têm telefone)
  const listaDoGrupo = (g) => (g === 'liderancas' ? liderancas : eleitores).filter(p => p.telefone);

  const abrirDisparo = (midia) => {
    setMidiaDisparo(midia);
    setGrupoAlvo('apoiadores');
    setFiltroLideranca('');
    setSelecionados(listaDoGrupo('apoiadores').map(p => p.id));
    setListaLinks([]);
  };

  const trocarGrupo = (g) => {
    setGrupoAlvo(g);
    setFiltroLideranca('');
    setSelecionados(listaDoGrupo(g).map(p => p.id));
  };

  const toggleSelecionado = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selecionarTodos = () => {
    const lista = listaDoGrupo(grupoAlvo);
    if (selecionados.length === lista.length) setSelecionados([]);
    else setSelecionados(lista.map(p => p.id));
  };

  const gerarLinks = async () => {
    if (selecionados.length === 0) return alert('❌ Selecione pelo menos um destinatário.');
    const alvos = listaDoGrupo(grupoAlvo).filter(e => selecionados.includes(e.id));
    const links = alvos.map(e => {
      const numero = '55' + e.telefone.replace(/\D/g, '');
      const msg = `Olá, ${e.nome}!\n\nO *Deputado Demo* compartilhou uma novidade:\n\n*${midiaDisparo.titulo}*\n${midiaDisparo.descricao ? midiaDisparo.descricao + '\n' : ''}\nhttps://gabinete-demo.vercel.app/#/m/${midiaDisparo.id}/${e.id}\n\nPara sair, responda *SAIR*.`;
      return { nome: e.nome, bairro: e.bairro || '', id: e.id, eleitor_id: e.id, url: `https://wa.me/${numero}?text=${encodeURIComponent(msg)}` };
    });
    // Registra o DISPARO (ato de enviar) na tabela de canais — NÃO em midias_cliques.
    // Os cliques reais são gravados só quando o destinatário abre o link (RPC registrar_clique_midia).
    for (const l of links) {
      await supabase.from('rastreamento_links').insert({
        canal: 'whatsapp_midia',
        bairro: l.bairro || null,
        eleitor_id: l.eleitor_id,
        data_clique: new Date().toISOString(),
      });
    }
    setMidiaDisparo(null);
    setListaLinks(links);
  };

  const filtrarPorLideranca = (liderancaId) => {
    setFiltroLideranca(liderancaId);
    if (!liderancaId) return;
    const apoiadores = eleitores.filter(e => e.lideranca_id === liderancaId).map(e => e.id);
    setSelecionados(apoiadores);
  };

  const copiarLink = (midia) => {
    navigator.clipboard.writeText(midia.arquivo_url);
    setLinkCopiado(midia.id);
    setTimeout(() => setLinkCopiado(null), 2000);
  };

  const excluirMidia = async (midia) => {
    if (!confirm('Excluir esta mídia permanentemente?')) return;
    await supabase.storage.from('midias-campanha').remove([midia.arquivo_path]);
    await supabase.from('midias_cliques').delete().eq('midia_id', midia.id);
    await supabase.from('midias').delete().eq('id', midia.id);
    fetchAll();
  };

  const icone = (tipo) => tipo === 'imagem' ? '🖼️' : tipo === 'video' ? '🎥' : tipo === 'pdf' ? '📄' : '📎';

  const estiloModal = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
  const estiloCardModal = { background: 'var(--surface)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' };

  return (
    <div style={{ padding: 'clamp(12px, 4vw, 24px)', maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
      <button onClick={onVoltar} style={{ marginBottom: '20px', padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
      <h2 style={{ color: '#1e40af', marginBottom: '24px', fontSize: '24px' }}>📤 Central de Mídias</h2>

      {/* Upload */}
      <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>➕ Enviar Nova Mídia</h3>
        {sucesso && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>{sucesso}</div>}
        {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>{erro}</div>}
        <input type="text" placeholder="Título da mídia *" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' }} />
        <textarea placeholder="Descrição (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical' }} />
        <div style={{ border: '2px dashed #93c5fd', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '12px', background: '#eff6ff' }}>
          <input type="file" id="file-upload" accept="image/*,video/*,.pdf" onChange={handleArquivo} style={{ display: 'none' }} />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>📁</p>
            <p style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '15px' }}>Clique para selecionar arquivo</p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Imagem, Vídeo ou PDF — máx. 50MB</p>
          </label>
          {arquivo && <div style={{ marginTop: '12px', padding: '8px', background: 'var(--surface)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)' }}>✅ {arquivo.name} ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)</div>}
          {preview && <img src={preview} alt="preview" style={{ marginTop: '12px', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />}
        </div>
        <button onClick={upload} disabled={uploading} style={{ width: '100%', padding: '14px', background: uploading ? '#93c5fd' : '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? '⏳ Enviando...' : '📤 Enviar Mídia'}
        </button>
      </div>

      {/* Lista mídias */}
      <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>📚 Mídias ({midias.length})</h3>
        {loading ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>⏳ Carregando...</p> :
          midias.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>📭 Nenhuma mídia ainda.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {midias.map(m => (
              <div key={m.id} style={{ borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text)' }}>{icone(m.tipo)} {m.titulo}</p>
                    {m.descricao && <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{m.descricao}</p>}
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{m.tipo?.toUpperCase()} • {new Date(m.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  {m.tipo === 'imagem' && <img src={m.arquivo_url} alt={m.titulo} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>👁️ Ver</a>
                  <button onClick={() => copiarLink(m)} style={{ padding: '7px 14px', background: linkCopiado === m.id ? '#dcfce7' : 'var(--surface-2)', color: linkCopiado === m.id ? '#166534' : 'var(--text)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {linkCopiado === m.id ? '✅ Copiado!' : '📋 Copiar Link'}
                  </button>
                  <button onClick={() => abrirDisparo(m)} style={{ padding: '7px 14px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📱 Disparar WhatsApp
                  </button>
                  <button onClick={() => excluirMidia(m)} style={{ padding: '7px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL SELETOR */}
      {midiaDisparo && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setMidiaDisparo(null)}>
          <div style={estiloCardModal}>
            <h3 style={{ color: '#1e40af', marginBottom: '6px' }}>📱 Disparar: {midiaDisparo.titulo}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>Escolha o público-alvo, selecione e clique em Gerar Links.</p>
            {/* Seletor de público-alvo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[{k:'apoiadores',l:'👤 Apoiadores'},{k:'liderancas',l:'⭐ Lideranças'}].map(g => (
                <button key={g.k} type="button" onClick={() => trocarGrupo(g.k)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: grupoAlvo===g.k?'2px solid #1e40af':'1px solid var(--border)', background: grupoAlvo===g.k?'#eff6ff':'var(--surface)', color: grupoAlvo===g.k?'#1e40af':'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {g.l}
                </button>
              ))}
            </div>
            {/* Filtro por Liderança (só apoiadores) */}
            {grupoAlvo === 'apoiadores' && (
            <div style={{ marginBottom: 12 }}>
              <select value={filtroLideranca} onChange={e => filtrarPorLideranca(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14 }}>
                <option value="">🔍 Filtrar por Liderança (todos)</option>
                {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text)' }}>{selecionados.length} de {listaDoGrupo(grupoAlvo).length} selecionados</span>
              <button onClick={selecionarTodos} style={{ background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {selecionados.length === listaDoGrupo(grupoAlvo).length ? '✗ Desmarcar todos' : '✓ Selecionar todos'}
              </button>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {listaDoGrupo(grupoAlvo).map(e => (
                <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: selecionados.includes(e.id) ? '#eff6ff' : 'var(--surface-2)', borderRadius: '10px', cursor: 'pointer', border: selecionados.includes(e.id) ? '1px solid #93c5fd' : '1px solid var(--border)' }}>
                  <input type="checkbox" checked={selecionados.includes(e.id)} onChange={() => toggleSelecionado(e.id)} style={{ width: '18px', height: '18px', accentColor: '#1e40af' }} />
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', color: selecionados.includes(e.id) ? '#111827' : 'var(--text)' }}>{e.nome}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>📱 {e.telefone}{e.bairro ? ` • 📍 ${e.bairro}` : ''}</p>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={gerarLinks} style={{ width: '100%', padding: '14px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
              📱 Gerar Links para {selecionados.length} destinatários
            </button>
            <button onClick={() => setMidiaDisparo(null)} style={{ width: '100%', padding: '12px', background: 'var(--surface-2)', color: 'var(--text)', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL LISTA DE LINKS */}
      {listaLinks.length > 0 && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setListaLinks([])}>
          <div style={estiloCardModal}>
            <h3 style={{ color: '#1e40af', marginBottom: '6px' }}>📱 Clique para enviar para cada eleitor</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Clique em cada botão verde para abrir o WhatsApp com a mensagem pronta.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {listaLinks.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac', textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{l.nome}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>📍 {l.bairro || 'sem bairro'}</p>
                  </div>
                  <span style={{ background: '#25D366', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold' }}>📱 Enviar</span>
                </a>
              ))}
            </div>
            <button onClick={() => setListaLinks([])} style={{ width: '100%', padding: '14px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              ✅ Concluído
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
