import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { enviarApuracao } from '../lib/apuracao';

export default function ApuracaoLancamento({ perfil, onVoltar }) {
  const [candidatos, setCandidatos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [municipio, setMunicipio] = useState('');
  const [zona, setZona] = useState('');
  const [secao, setSecao] = useState('');
  const [votos, setVotos] = useState({});
  const [totalSecao, setTotalSecao] = useState('');
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('apuracao_candidatos').select('*').order('ordem').then(({ data }) => setCandidatos(data || []));
    supabase.from('locais_votacao').select('municipio, zona, secoes').then(({ data }) => setLocais(data || []));
  }, []);

  const municipios = useMemo(() => [...new Set(locais.map(l => l.municipio).filter(Boolean))].sort(), [locais]);
  const zonas = useMemo(() => [...new Set(locais.filter(l => l.municipio === municipio).map(l => l.zona).filter(Boolean))].sort(), [locais, municipio]);

  async function enviar(e) {
    e.preventDefault();
    if (!municipio || !zona || !secao) { setMsg('Preencha município, zona e seção.'); return; }
    if (!foto) { setMsg('Anexe a foto do boletim.'); return; }
    setEnviando(true); setMsg('');
    const dados = {
      municipio, zona, secao,
      votos: Object.fromEntries(candidatos.map(c => [c.id, Number(votos[c.id]) || 0])),
      total_secao: totalSecao ? Number(totalSecao) : null,
      reportado_por: perfil?.user_id || null,
      reportado_nome: perfil?.nome || null,
    };
    const r = await enviarApuracao(dados, foto);
    setMsg(r.modo === 'fila' ? '📴 Sem conexão — salvo e será enviado ao reconectar.' : '✅ Seção registrada!');
    setVotos({}); setTotalSecao(''); setSecao(''); setFoto(null);
    e.target.reset?.();
    setEnviando(false);
  }

  const inp = { width: '100%', padding: 10, marginBottom: 10, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, boxSizing: 'border-box' };
  return (
    <form onSubmit={enviar} style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#CBA15C', margin: 0 }}>Apuração — lançar seção</h2>
        {onVoltar && <button type="button" onClick={onVoltar} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>←</button>}
      </div>
      <select value={municipio} onChange={e => { setMunicipio(e.target.value); setZona(''); }} style={inp}>
        <option value="">Município...</option>
        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={zona} onChange={e => setZona(e.target.value)} style={inp} disabled={!municipio}>
        <option value="">Zona...</option>
        {zonas.map(z => <option key={z} value={z}>Zona {z}</option>)}
      </select>
      <input placeholder="Seção (número)" value={secao} onChange={e => setSecao(e.target.value)} style={inp} inputMode="numeric" />
      <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: 12 }}>
        {candidatos.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1, color: 'var(--text)' }}>{c.eh_nosso ? '⭐ ' : ''}{c.nome}</span>
            <input type="number" min="0" value={votos[c.id] || ''} onChange={e => setVotos({ ...votos, [c.id]: e.target.value })} placeholder="votos" style={{ ...inp, width: 110, marginBottom: 0 }} />
          </div>
        ))}
      </div>
      <input type="number" min="0" placeholder="Total de votos da seção (opcional)" value={totalSecao} onChange={e => setTotalSecao(e.target.value)} style={inp} />
      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>Foto do boletim *</label>
      <input type="file" accept="image/*" capture="environment" onChange={e => setFoto(e.target.files?.[0] || null)} style={inp} />
      {msg && <p style={{ color: '#CBA15C' }}>{msg}</p>}
      <button type="submit" disabled={enviando} style={{ width: '100%', background: '#CBA15C', color: '#0E2236', border: 'none', padding: 14, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        {enviando ? 'Enviando...' : 'Registrar seção'}
      </button>
    </form>
  );
}
