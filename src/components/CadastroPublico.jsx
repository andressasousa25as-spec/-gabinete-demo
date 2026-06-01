import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BAIRROS = ['Acai','Alvorada','Arsenal','Bone Azul','Buritizal','Cabralzinho','Central','Centro','Cidade Nova','Congos','Fazendinha','Fortaleza','Infraero 1','Infraero 2','Jardim Equatorial','Jardim Felicidade','Jesus de Nazare','Laguinho','Marabaixo','Marabaixo 1','Marabaixo 2','Marabaixo 3','Marabaixo 4','Marco Zero','Muca','Nova Brasilia','Nova Esperanca','Novo Buritizal','Novo Horizonte','Pacoval','Pedrinhas','Perpetuo Socorro','Renascer','Santa Ines','Santa Rita','Sao Jose','Sao Lazaro','Trem','Universidade','Vale Verde','Zerao','Outro'].sort();
const ZONAS = Array.from({length:35},(_,i)=>String(i+1));

export default function CadastroPublico({ liderancaId }) {
  const [lideranca, setLideranca] = useState(null);
  const [form, setForm] = useState({ nome:'', telefone:'', bairro:'', municipio:'', zona_eleitoral:'', secao_eleitoral:'' });
  const [termoAceito, setTermoAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const buscarLideranca = async () => {
      const { data } = await supabase.from('liderancas').select('id, nome, bairro').eq('id', liderancaId).single();
      if (data) setLideranca(data);
    };
    if (liderancaId) buscarLideranca();
  }, [liderancaId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termoAceito) return setErro('Aceite o Termo LGPD para continuar.');
    if (!form.nome || !form.telefone) return setErro('Nome e telefone sao obrigatorios.');
    setSalvando(true);
    setErro('');
    const { error } = await supabase.from('eleitores').insert({
      ...form,
      lideranca_id: liderancaId,
      consentimento_lgpd: true,
      data_consentimento: new Date().toISOString(),
      opt_out: false,
    });
    if (error) { setErro('Erro ao cadastrar: ' + error.message); setSalvando(false); return; }
    setSucesso(true);
    setSalvando(false);
  };

  if (sucesso) return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#1e293b', borderRadius:20, padding:40, maxWidth:480, width:'100%', textAlign:'center', border:'1px solid #334155' }}>
        <p style={{ fontSize:48, marginBottom:16 }}>✅</p>
        <h2 style={{ color:'#f1f5f9', marginBottom:8 }}>Cadastro realizado!</h2>
        <p style={{ color:'#94a3b8', fontSize:15 }}>Obrigado, {form.nome}! Voce foi cadastrado com sucesso.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#1e293b', borderRadius:20, padding:32, maxWidth:480, width:'100%', border:'1px solid #334155' }}>
        <h2 style={{ color:'#f1f5f9', marginBottom:4, fontSize:22 }}>Cadastro de Apoiador</h2>
        {lideranca && <p style={{ color:'#f59e0b', fontSize:14, marginBottom:20 }}>Indicado por: {lideranca.nome}{lideranca.bairro ? ' - ' + lideranca.bairro : ''}</p>}

        {erro && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:14 }}>{erro}</div>}

        <form onSubmit={handleSubmit}>
          <input name="nome" placeholder="Nome completo *" value={form.nome} onChange={handleChange} required
            style={{ width:'100%', padding:12, marginBottom:12, background:'#0f172a', color:'#f1f5f9', border:'1px solid #334155', borderRadius:8, boxSizing:'border-box', fontSize:15 }} />
          <input name="telefone" placeholder="WhatsApp * ex: 96999998888" value={form.telefone} onChange={handleChange} required
            style={{ width:'100%', padding:12, marginBottom:12, background:'#0f172a', color:'#f1f5f9', border:'1px solid #334155', borderRadius:8, boxSizing:'border-box', fontSize:15 }} />
          <select name="bairro" value={form.bairro} onChange={handleChange}
            style={{ width:'100%', padding:12, marginBottom:12, background:'#0f172a', color:'#f1f5f9', border:'1px solid #334155', borderRadius:8, boxSizing:'border-box', fontSize:15 }}>
            <option value="">Selecione o bairro...</option>
            {BAIRROS.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
          <input name="municipio" placeholder="Municipio" value={form.municipio} onChange={handleChange}
            style={{ width:'100%', padding:12, marginBottom:12, background:'#0f172a', color:'#f1f5f9', border:'1px solid #334155', borderRadius:8, boxSizing:'border-box', fontSize:15 }} />
          <div style={{ display:'flex', gap:12, marginBottom:12 }}>
            <select name="zona_eleitoral" value={form.zona_eleitoral} onChange={handleChange}
              style={{ flex:1, padding:12, background:'#0f172a', color:'#f1f5f9', border:'1px solid #334155', borderRadius:8, boxSizing:'border-box', fontSize:15 }}>
              <option value="">Zona...</option>
              {ZONAS.map(z=><option key={z} value={z}>Zona {z}</option>)}
            </select>
            <input name="secao_eleitoral" placeholder="Secao" type="number" value={form.secao_eleitoral} onChange={handleChange}
              style={{ flex:1, padding:12, background:'#0f172a', color:'#f1f5f9', border:'1px solid #334155', borderRadius:8, boxSizing:'border-box', fontSize:15 }} />
          </div>

          <div style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:12, padding:16, marginBottom:16 }}>
            <p style={{ color:'#60a5fa', fontWeight:'bold', fontSize:13, marginBottom:8 }}>Termo LGPD / TSE</p>
            <p style={{ color:'#94a3b8', fontSize:12, lineHeight:1.6, marginBottom:12 }}>
              Autorizo o tratamento dos meus dados para fins de comunicacao politica, conforme Lei 13.709/2018 e Resolucoes do TSE. Posso revogar respondendo SAIR.
            </p>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={termoAceito} onChange={e=>setTermoAceito(e.target.checked)} style={{ width:18, height:18, accentColor:'#1e40af' }} />
              <span style={{ color:'#f1f5f9', fontSize:13, fontWeight:500 }}>Li e aceito o Termo</span>
            </label>
          </div>

          <button type="submit" disabled={salvando}
            style={{ width:'100%', padding:14, background: salvando ? '#334155' : '#1e40af', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:'bold', cursor: salvando ? 'not-allowed' : 'pointer' }}>
            {salvando ? 'Salvando...' : 'Confirmar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}