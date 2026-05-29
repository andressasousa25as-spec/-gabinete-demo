import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    const { data: lData } = await supabase.from('liderancas').select('id, nome').order('nome');
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
    if (!titulo) return setErro('? Digite um t�tulo para a m�dia.');
    if (!arquivo) return setErro('? Selecione um arquivo.');
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
      setSucesso('? M�dia enviada com sucesso!');
      setTitulo(''); setDescricao(''); setArquivo(null); setPreview(null);
      fetchAll();
    } catch (err) {
      setErro('? Erro ao enviar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const abrirDisparo = (midia) => {
    setMidiaDisparo(midia);
    setSelecionados(eleitores.map(e => e.id));
    setListaLinks([]);
  };

  const toggleSelecionado = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selecionarTodos = () => {
    if (selecionados.length === eleitores.length) setSelecionados([]);
    else setSelecionados(eleitores.map(e => e.id));
  };

  const gerarLinks = async () => {
    if (selecionados.length === 0) return alert('? Selecione pelo menos um eleitor.');
    const alvos = eleitores.filter(e => selecionados.includes(e.id));
    const links = alvos.map(e => {
      const numero = '55' + e.telefone.replace(/\D/g, '');
      const msg = `Ol�, ${e.nome}! ??\n\nO Dep. Deputado Demo compartilhou uma novidade:\n\n?? *${midiaDisparo.titulo}*\n${midiaDisparo.descricao ? midiaDisparo.descricao + '\n' : ''}\n?? https://gabinete-asf.vercel.app/#/m/${midiaDisparo.id}/${e.id}\n\nPara sair responda *SAIR*. ?`;
      return { nome: e.nome, bairro: e.bairro || '', id: e.id, eleitor_id: e.id, url: `https://wa.me/${numero}?text=${encodeURIComponent(msg)}` };
    });
    for (const l of links) {
      const { error } = await supabase.from('midias_cliques').insert({
        midia_id: midiaDisparo.id, eleitor_id: l.eleitor_id,
        bairro: l.bairro, data_clique: new Date().toISOString(),
        lideranca_id: l.lideranca_id || null,
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
    if (!confirm('Excluir esta m�dia permanentemente?')) return;
    await supabase.storage.from('midias-campanha').remove([midia.arquivo_path]);
    await supabase.from('midias_cliques').delete().eq('midia_id', midia.id);
    await supabase.from('midias').delete().eq('id', midia.id);
    fetchAll();
  };

  const icone = (tipo) => tipo === 'imagem' ? '???' : tipo === 'video' ? '??' : tipo === 'pdf' ? '??' : '??';

  const estiloModal = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
  const estiloCardModal = { background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onVoltar} style={{ marginBottom: '20px', padding: '10px 20px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>? Voltar</button>
      <h2 style={{ color: '#1e40af', marginBottom: '24px', fontSize: '24px' }}>?? Central de M�dias</h2>

      {/* Upload */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginBottom: '16px' }}>? Enviar Nova M�dia</h3>
        {sucesso && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>{sucesso}</div>}
        {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>{erro}</div>}
        <input type="text" placeholder="T�tulo da m�dia *" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' }} />
        <textarea placeholder="Descri��o (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical' }} />
        <div style={{ border: '2px dashed #93c5fd', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '12px', background: '#eff6ff' }}>
          <input type="file" id="file-upload" accept="image/*,video/*,.pdf" onChange={handleArquivo} style={{ display: 'none' }} />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>??</p>
            <p style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '15px' }}>Clique para selecionar arquivo</p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Imagem, V�deo ou PDF � m�x. 50MB</p>
          </label>
          {arquivo && <div style={{ marginTop: '12px', padding: '8px', background: 'white', borderRadius: '8px', fontSize: '14px', color: '#374151' }}>? {arquivo.name} ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)</div>}
          {preview && <img src={preview} alt="preview" style={{ marginTop: '12px', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />}
        </div>
        <button onClick={upload} disabled={uploading} style={{ width: '100%', padding: '14px', background: uploading ? '#93c5fd' : '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? '? Enviando...' : '?? Enviar M�dia'}
        </button>
      </div>

      {/* Lista m�dias */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginBottom: '16px' }}>?? M�dias ({midias.length})</h3>
        {loading ? <p style={{ color: '#6b7280', textAlign: 'center' }}>? Carregando...</p> :
          midias.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>?? Nenhuma m�dia ainda.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {midias.map(m => (
              <div key={m.id} style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#111827' }}>{icone(m.tipo)} {m.titulo}</p>
                    {m.descricao && <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{m.descricao}</p>}
                    <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{m.tipo?.toUpperCase()} � {new Date(m.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  {m.tipo === 'imagem' && <img src={m.arquivo_url} alt={m.titulo} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>??? Ver</a>
                  <button onClick={() => copiarLink(m)} style={{ padding: '7px 14px', background: linkCopiado === m.id ? '#dcfce7' : '#f3f4f6', color: linkCopiado === m.id ? '#166534' : '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {linkCopiado === m.id ? '? Copiado!' : '?? Copiar Link'}
                  </button>
                  <button onClick={() => abrirDisparo(m)} style={{ padding: '7px 14px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ?? Disparar WhatsApp
                  </button>
                  <button onClick={() => excluirMidia(m)} style={{ padding: '7px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>???</button>
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
            <h3 style={{ color: '#1e40af', marginBottom: '6px' }}>?? Disparar: {midiaDisparo.titulo}</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Selecione os eleitores e clique em Gerar Links.</p>
            {/* Filtro por Lideran�a */}
            <div style={{ marginBottom: 12 }}>
              <select value={filtroLideranca} onChange={e => filtrarPorLideranca(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 14 }}>
                <option value="">?? Filtrar por Lideran�a (todos)</option>
                {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{selecionados.length} de {eleitores.length} selecionados</span>
              <button onClick={selecionarTodos} style={{ background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {selecionados.length === eleitores.length ? '? Desmarcar todos' : '? Selecionar todos'}
              </button>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {eleitores.map(e => (
                <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: selecionados.includes(e.id) ? '#eff6ff' : '#f9fafb', borderRadius: '10px', cursor: 'pointer', border: selecionados.includes(e.id) ? '1px solid #93c5fd' : '1px solid #e5e7eb' }}>
                  <input type="checkbox" checked={selecionados.includes(e.id)} onChange={() => toggleSelecionado(e.id)} style={{ width: '18px', height: '18px', accentColor: '#1e40af' }} />
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{e.nome}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>?? {e.telefone}{e.bairro ? ` � ?? ${e.bairro}` : ''}</p>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={gerarLinks} style={{ width: '100%', padding: '14px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
              ?? Gerar Links para {selecionados.length} eleitores
            </button>
            <button onClick={() => setMidiaDisparo(null)} style={{ width: '100%', padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL LISTA DE LINKS */}
      {listaLinks.length > 0 && (
        <div style={estiloModal} onClick={e => e.target === e.currentTarget && setListaLinks([])}>
          <div style={estiloCardModal}>
            <h3 style={{ color: '#1e40af', marginBottom: '6px' }}>?? Clique para enviar para cada eleitor</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Clique em cada bot�o verde para abrir o WhatsApp com a mensagem pronta.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {listaLinks.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac', textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{l.nome}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>?? {l.bairro || 'sem bairro'}</p>
                  </div>
                  <span style={{ background: '#25D366', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold' }}>?? Enviar</span>
                </a>
              ))}
            </div>
            <button onClick={() => setListaLinks([])} style={{ width: '100%', padding: '14px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              ? Conclu�do
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
