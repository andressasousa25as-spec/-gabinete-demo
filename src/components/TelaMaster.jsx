import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const btn = (bg) => ({ background:bg, color:'white', border:'none', borderRadius:8, padding:'10px 16px', cursor:'pointer', fontWeight:700, fontSize:14 });

export default function TelaMaster({ onVoltar }) {
  const [lic, setLic] = useState(null);
  const [msg, setMsg] = useState('');

  const carregar = () => supabase.from('licenca').select('*').eq('id',1).maybeSingle().then(({data})=>setLic(data));
  useEffect(()=>{ carregar(); }, []);

  const salvar = async (campos) => {
    setMsg('Salvando...');
    const { error } = await supabase.from('licenca').update({ ...campos, atualizado_em: new Date().toISOString() }).eq('id',1);
    setMsg(error ? 'Erro: '+error.message : 'Salvo.');
    carregar();
  };

  const addDias = (n) => {
    const base = lic?.validade && new Date(lic.validade) > new Date() ? new Date(lic.validade) : new Date();
    base.setDate(base.getDate()+n);
    salvar({ status:'ativo', validade: base.toISOString().slice(0,10) });
  };

  if (!lic) return <div style={{padding:24,color:'var(--text)',background:'var(--bg)',minHeight:'100vh'}}>Carregando...</div>;

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh',padding:'24px',color:'var(--text)'}}>
      <button onClick={onVoltar} style={{marginBottom:20,padding:'10px 20px',background:'#1e40af',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>Voltar</button>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:24,maxWidth:480,color:'var(--text)'}}>
        <h2 style={{marginTop:0,color:'var(--text)'}}>👑 Painel Master — Assinatura</h2>
        <p>Status: <b style={{color:lic.status==='ativo'?'#22c55e':lic.status==='vencido'?'#ef4444':'#f59e0b'}}>{lic.status}</b></p>
        <p>Validade: <b>{lic.validade}</b></p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}>
          <button onClick={()=>addDias(45)} style={btn('#16a34a')}>Ativar / +45 dias</button>
          <button onClick={()=>addDias(30)} style={btn('#0ea5e9')}>+30 dias</button>
          <button onClick={()=>salvar({status:'vencido'})} style={btn('#dc2626')}>Bloquear agora</button>
        </div>
        {msg && <p style={{marginTop:14,color:'#60a5fa'}}>{msg}</p>}
      </div>
    </div>
  );
}
