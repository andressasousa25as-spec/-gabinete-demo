import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import MapaDemo from './MapaDemo';
import LinkRastreavel from './LinkRastreavel';
import CadastroEleitorDemo from './CadastroEleitorDemo';
import PainelRastreamento from './PainelRastreamento';
import GestaoMidias from './GestaoMidias';
import AnalyticsMidias from './AnalyticsMidias';
import CentralRedesSociais from './CentralRedesSociais';
import RankingEngajamento from './RankingEngajamento';
import GestaoAnotacoes from './GestaoAnotacoes';
import CenarioPolitico from './CenarioPolitico';
import GestaoAdmins from './GestaoAdmins';
import DiagnosticoEleitoral from './DiagnosticoEleitoral';
import MapaEleitoral from './MapaEleitoral';
import AnaliseTerritorial from './AnaliseTerritorial';
import RadarOportunidade from './RadarOportunidade';
import CaminhoVitoria from './CaminhoVitoria';
import ProjecaoEstrategica from './ProjecaoEstrategica';
import CenarioMunicipal from './CenarioMunicipal';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FiaW5ldGVkaWdpdGFsc2YiLCJhIjoiY21wb3o3cjBjMDY1djJzcHZyOXM4Y3JmZSJ9.S1a4VYKtkm_2Bn3Hxowugw';
const formatarWA = (tel) => { if (!tel) return null; const n = tel.replace(/\D/g,''); return n.length < 8 ? null : n.startsWith('55') ? n : '55'+n; };
const estiloModal = { position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' };
const estiloCard = { backgroundColor:'white',borderRadius:'20px',padding:'32px',color:'#111827',width:'100%',maxWidth:'560px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.3)' };
const estiloInput = { width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1px solid #cbd5e1',fontSize:'15px',marginBottom:'12px',boxSizing:'border-box' };
const estiloBotao = (cor) => ({ width:'100%',padding:'14px',borderRadius:'10px',border:'none',backgroundColor:cor,color:'white',fontSize:'16px',fontWeight:'bold',cursor:'pointer',marginTop:'8px' });
const BAIRROS = ['Acai','Alvorada','Arsenal','Bone Azul','Buritizal','Cabralzinho','Central','Centro','Cidade Nova','Congos','Fazendinha','Fortaleza','Infraero 1','Infraero 2','Jardim Equatorial','Jardim Felicidade','Jesus de Nazare','Laguinho','Marabaixo','Marabaixo 1','Marabaixo 2','Marabaixo 3','Marabaixo 4','Marco Zero','Muca','Nova Brasilia','Nova Esperanca','Novo Buritizal','Novo Horizonte','Pacoval','Pedrinhas','Perpetuo Socorro','Renascer','Santa Ines','Santa Rita','Sao Jose','Sao Lazaro','Trem','Universidade','Vale Verde','Zerao','Outro'].sort();

function RelatorioImpressao({ titulo, dados, colunas, onFechar }) {
  const ref = useRef();
  const imprimir = () => {
    const janela = window.open('','_blank');
    janela.document.write('<html><head><title>'+titulo+'</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:10px}td{padding:8px;border-bottom:1px solid #e5e7eb}@media print{button{display:none}}</style></head><body>'+ref.current.innerHTML+'</body></html>');
    janela.document.close();
    setTimeout(()=>{janela.print();janela.close();},500);
  };
  return (
    <div style={estiloModal} onClick={e=>e.target===e.currentTarget&&onFechar()}>
      <div style={{...estiloCard,maxWidth:'900px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
          <h2 style={{color:'#1e40af',margin:0}}>{titulo}</h2>
          <div style={{display:'flex',gap:10}}>
            <button onClick={imprimir} style={{background:'#1e40af',color:'white',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:'bold'}}>Imprimir / PDF</button>
            <button onClick={onFechar} style={{background:'#64748b',color:'white',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:'bold'}}>Fechar</button>
          </div>
        </div>
        <div ref={ref}>
          <h1>{titulo}</h1>
          <p>Gabinete Digital — Candidato Demo 2026 | {new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Total:</strong> {dados.length}</p>
          <table>
            <thead><tr>{colunas.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>{dados.map((item,i)=><tr key={i}>{colunas.map(c=><td key={c.key}>{item[c.key]||'--'}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ candidato, perfil, onLogout }) {
  const [aba, setAba] = useState('inicio');
  const [eleitores, setEleitores] = useState([]);
  const [liderancas, setLiderancas] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [showCadastro, setShowCadastro] = useState(false);
  const [showLider, setShowLider] = useState(false);
  const [showReuniao, setShowReuniao] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [foto, setFoto] = useState(() => localStorage.getItem("demo_foto") || null);
  const [nomeAtual, setNomeAtual] = useState(candidato);
  const [nomeEdit, setNomeEdit] = useState(candidato);
  const [editandoNome, setEditandoNome] = useState(false);
  const fotoInput = useRef(null);
  const [novaLider, setNovaLider] = useState({nome:'',telefone:'',bairro:'',demanda:''});
  const [novaReuniao, setNovaReuniao] = useState({titulo:'',data:'',local:'',endereco:''});

  const fetchAll = async () => {
    const [e,l,r] = await Promise.all([
      supabase.from('eleitores').select('*').order('created_at',{ascending:false}),
      supabase.from('liderancas').select('*').order('created_at',{ascending:false}),
      supabase.from('reunioes').select('*').order('data',{ascending:false}),
    ]);
    if(e.data) setEleitores(e.data);
    if(l.data) setLiderancas(l.data);
    if(r.data) setReunioes(r.data);
  };

  useEffect(()=>{fetchAll();},[]);

  const handleFoto = (e) => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ setFoto(ev.target.result); localStorage.setItem("demo_foto", ev.target.result); }; r.readAsDataURL(f); };

  const cadastrarLider = async () => {
    if(!novaLider.nome) return alert('Nome obrigatorio.');
    setLoading(true);
    const {error} = await supabase.from('liderancas').insert([novaLider]);
    if(!error){fetchAll();setNovaLider({nome:'',telefone:'',bairro:'',demanda:''});setShowLider(false);alert('Lideranca cadastrada!');}
    else alert('Erro: '+error.message);
    setLoading(false);
  };

  const cadastrarReuniao = async () => {
    if(!novaReuniao.titulo||!novaReuniao.data) return alert('Titulo e data obrigatorios.');
    setLoading(true);
    const {error} = await supabase.from('reunioes').insert([novaReuniao]);
    if(!error){fetchAll();setNovaReuniao({titulo:'',data:'',local:'',endereco:''});setShowReuniao(false);alert('Reuniao agendada!');}
    else alert('Erro: '+error.message);
    setLoading(false);
  };

  const excluir = async (tabela,id) => {
    if(!confirm('Excluir?')) return;
    await supabase.from(tabela).delete().eq('id',id);
    fetchAll();
  };

  const abrirRelatorio = (tipo) => {
    const cfg = {
      eleitores:{titulo:'Relatorio de Eleitores',dados:eleitores.map(e=>({nome:e.nome,telefone:e.telefone,bairro:e.bairro||'--',zona:e.zona_eleitoral?'Zona '+e.zona_eleitoral:'--',municipio:e.municipio||'Macapa'})),colunas:[{key:'nome',label:'Nome'},{key:'telefone',label:'Telefone'},{key:'bairro',label:'Bairro'},{key:'zona',label:'Zona'},{key:'municipio',label:'Municipio'}]},
      liderancas:{titulo:'Relatorio de Liderancas',dados:liderancas.map(l=>({nome:l.nome,telefone:l.telefone||'--',bairro:l.bairro||'--',demanda:l.demanda||'--'})),colunas:[{key:'nome',label:'Nome'},{key:'telefone',label:'Telefone'},{key:'bairro',label:'Bairro'},{key:'demanda',label:'Demanda'}]},
      reunioes:{titulo:'Relatorio de Reunioes',dados:reunioes.map(r=>({titulo:r.titulo,data:r.data?new Date(r.data).toLocaleString('pt-BR'):'--',local:r.local||'--'})),colunas:[{key:'titulo',label:'Titulo'},{key:'data',label:'Data'},{key:'local',label:'Local'}]},
    };
    setRelatorio(cfg[tipo]);
  };

  if(aba==='midias') return <GestaoMidias onVoltar={()=>setAba('inicio')} />;
  if(aba==='analytics') return <AnalyticsMidias onVoltar={()=>setAba('inicio')} />;
  if(aba==='ranking') return <RankingEngajamento onVoltar={()=>setAba('inicio')} />;
  if(aba==='admins') return <GestaoAdmins onVoltar={()=>setAba('inicio')} />;
  if(aba==='diagnostico') return <DiagnosticoEleitoral onVoltar={()=>setAba('inicio')} />;
  if(aba==='mapaeleitoral') return <MapaEleitoral onVoltar={()=>setAba('inicio')} />;
  if(aba==='territorial') return <AnaliseTerritorial onVoltar={()=>setAba('inicio')} />;
  if(aba==='radar') return <RadarOportunidade onVoltar={()=>setAba('inicio')} />;
  if(aba==='caminho') return <CaminhoVitoria onVoltar={()=>setAba('inicio')} />;
  if(aba==='projecao') return <ProjecaoEstrategica onVoltar={()=>setAba('inicio')} />;
  if(aba==='cenario') return <CenarioPolitico onVoltar={()=>setAba('inicio')} />;
  if(aba==='cenario-municipal') return <CenarioMunicipal onVoltar={()=>setAba('inicio')} />;
  if(aba==='anotacoes') return <GestaoAnotacoes liderancaId={liderancas[0]?.id||null} onVoltar={()=>setAba('inicio')} />;
  if(aba==='mapa') return (<div style={{background:'#0f172a',minHeight:'100vh'}}><button onClick={()=>setAba('inicio')} style={{margin:20,padding:'10px 20px',background:'#1e40af',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>Voltar</button><MapaDemo token={MAPBOX_TOKEN} candidato={nomeAtual} /></div>);
  if(aba==='redes') return <CentralRedesSociais perfil={perfil} onVoltar={()=>setAba('inicio')} />;
  if(aba==='rastreamento') return (<div style={{minHeight:'100vh',background:'#0f172a',color:'white',padding:24}}><button onClick={()=>setAba('inicio')} style={{marginBottom:20,padding:'10px 20px',background:'#1e40af',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>Voltar</button><PainelRastreamento onVoltar={()=>setAba('inicio')} /></div>);
  if(aba==='relatorios') return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'white',padding:24}}>
      <button onClick={()=>setAba('inicio')} style={{marginBottom:20,padding:'10px 20px',background:'#1e40af',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>Voltar</button>
      <h2 style={{marginBottom:20,color:'white'}}>Relatorios</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
        {['eleitores','liderancas','reunioes'].map(t=>(
          <button key={t} onClick={()=>abrirRelatorio(t)} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:12,padding:24,cursor:'pointer',color:'white',fontSize:15,fontWeight:700,textTransform:'capitalize'}}>{t}</button>
        ))}
      </div>
      {relatorio&&<RelatorioImpressao {...relatorio} onFechar={()=>setRelatorio(null)} />}
    </div>
  );

  const eleitorFiltrados = eleitores.filter(e=>e.nome?.toLowerCase().includes(busca.toLowerCase())||e.bairro?.toLowerCase().includes(busca.toLowerCase())||e.telefone?.includes(busca));
  const botoesMenu = perfil==='candidato'
    ? [{l:'Config',a:()=>alert('Configure seu nome em Configuracoes no Supabase')},{l:'ADMs',a:()=>setAba('admins')},{l:'+ Eleitor',a:()=>setShowCadastro(true)},{l:'+ Lideranca',a:()=>setShowLider(true)},{l:'+ Reuniao',a:()=>setShowReuniao(true)},{l:'Mapa',a:()=>setAba('mapa')},{l:'Anotacoes',a:()=>setAba('anotacoes')},{l:'Midias',a:()=>setAba('midias')},{l:'Analytics',a:()=>setAba('analytics')},{l:'Ranking',a:()=>setAba('ranking')},{l:'Redes Sociais',a:()=>setAba('redes')},{l:'Links',a:()=>setAba('rastreamento')},{l:'Cenario',a:()=>setAba('cenario')},{l:'🏛️ Cenario Municipal',a:()=>setAba('cenario-municipal')},{l:'Diagnostico',a:()=>setAba('diagnostico')},{l:'Mapa TSE',a:()=>setAba('mapaeleitoral')},{l:'Territorial',a:()=>setAba('territorial')},{l:'Oportunidades',a:()=>setAba('radar')},{l:'Vitoria',a:()=>setAba('caminho')},{l:'Projecao',a:()=>setAba('projecao')},{l:'Relatorios',a:()=>setAba('relatorios')}]
    : [{l:'+ Eleitor',a:()=>setShowCadastro(true)},{l:'+ Reuniao',a:()=>setShowReuniao(true)},{l:'Mapa',a:()=>setAba('mapa')},{l:'Midias',a:()=>setAba('midias')},{l:'Redes Sociais',a:()=>setAba('redes')},{l:'Relatorios',a:()=>setAba('relatorios')}];

  return (
    <div style={{background:'#0a0f1c',minHeight:'100vh',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14,color:'#f1f5f9'}}>
      <header style={{background:'#0f172a',padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,borderRadius:16,border:'1px solid #1e293b'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div onClick={()=>perfil==='candidato'&&fotoInput.current.click()} style={{width:56,height:56,borderRadius:'50%',background:foto?'transparent':'#1e293b',border:'2px solid #3b82f6',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden'}}>
            {foto?<img src={foto} style={{width:'100%',height:'100%',objectFit:'cover'}} />:<span style={{fontSize:14,color:'#64748b'}}>Foto</span>}
          </div>
          {perfil==='candidato'&&<input ref={fotoInput} type="file" accept="image/*" onChange={handleFoto} style={{display:'none'}} />}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {editandoNome?(<><input value={nomeEdit} onChange={e=>setNomeEdit(e.target.value)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #3b82f6',background:'#1e293b',color:'white',fontSize:16,fontWeight:700}} /><button onClick={()=>{setNomeAtual(nomeEdit);setEditandoNome(false);}} style={{background:'#16a34a',color:'white',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer'}}>OK</button><button onClick={()=>setEditandoNome(false)} style={{background:'#ef4444',color:'white',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer'}}>X</button></>):(<><h1 style={{fontSize:18,fontWeight:800,margin:0,color:'white'}}>{nomeAtual}</h1>{perfil==='candidato'&&<button onClick={()=>setEditandoNome(true)} style={{background:'none',border:'none',color:'#60a5fa',cursor:'pointer',fontSize:12}}>editar</button>}</>)}
            </div>
            <p style={{color:'#f59e0b',fontSize:13,margin:0,fontWeight:600}}>{perfil==='candidato'?'Candidato':'Equipe'}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{background:'#ef4444',color:'white',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontWeight:700}}>Sair</button>
      </header>

      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {botoesMenu.map((b,i)=><button key={i} onClick={b.a} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',padding:'10px 18px',cursor:'pointer',fontWeight:600,fontSize:13}}>{b.l}</button>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16}}>
        {[{t:'Total de Eleitores',v:eleitores.length,s:'Meta: 50.000',c:'#3b82f6'},{t:'Liderancas Ativas',v:liderancas.length,s:'Meta: 200',c:'#f59e0b'},{t:'Reunioes Realizadas',v:reunioes.filter(r=>r.status==='realizada').length,s:reunioes.length+' agendadas',c:'#10b981'},{t:'Bairros Cobertos',v:[...new Set(eleitores.map(e=>e.bairro).filter(Boolean))].length,s:'em Macapa',c:'#8b5cf6'}].map((x,i)=>(
          <div key={i} style={{background:'#1e293b',borderRadius:12,padding:20,border:'1px solid '+x.c+'44'}}>
            <p style={{color:'#94a3b8',fontSize:13,marginBottom:4}}>{x.t}</p>
            <p style={{color:x.c,fontSize:32,fontWeight:800,margin:'4px 0'}}>{x.v}</p>
            <p style={{color:'#64748b',fontSize:12,margin:0}}>{x.s}</p>
          </div>
        ))}
      </div>

      <div style={{background:'#111827',borderRadius:12,padding:20,border:'1px solid #1f2937'}}>
        <h3 style={{fontWeight:'bold',fontSize:16,color:'#60a5fa',marginBottom:12}}>Proximas Reunioes</h3>
        {reunioes.length===0?<p style={{color:'#9ca3af',fontSize:13}}>Nenhuma reuniao.</p>:reunioes.slice(0,5).map(r=>(
          <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f2937',gap:8,flexWrap:'wrap'}}>
            <div><p style={{fontWeight:600,margin:0,color:'#f1f5f9'}}>{r.titulo}</p><p style={{color:'#94a3b8',fontSize:13,margin:'2px 0 0'}}>{r.local}</p></div>
            <span style={{background:'#1e40af',color:'white',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,flexShrink:0}}>{r.data?new Date(r.data).toLocaleDateString('pt-BR'):'--'}</span>
          </div>
        ))}
      </div>

      <div style={{background:'#111827',borderRadius:12,padding:20,border:'1px solid #1f2937'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontWeight:'bold',fontSize:16,color:'#60a5fa',margin:0}}>Eleitores ({eleitores.length})</h3>
          {perfil==='candidato'&&<button onClick={()=>setShowCadastro(true)} style={{background:'#1e40af',color:'white',border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}>+ Cadastrar</button>}
        </div>
        <input type="text" placeholder="Buscar por nome, bairro ou telefone..." value={busca} onChange={e=>setBusca(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #334155',fontSize:13,marginBottom:10,boxSizing:'border-box',background:'#0a0f1c',color:'#f1f5f9'}} />
        <div style={{maxHeight:400,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
          {eleitorFiltrados.length===0?<p style={{color:'#9ca3af',fontSize:13,textAlign:'center',padding:'20px 0'}}>Nenhum eleitor.</p>:eleitorFiltrados.map(e=>{
            const wa=formatarWA(e.telefone);
            return (<div key={e.id} style={{background:'#1a2332',borderRadius:8,padding:'10px 12px',border:'1px solid #1f2937',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <p style={{fontWeight:'bold',fontSize:13,color:'#f1f5f9',margin:'0 0 2px'}}>{e.nome}</p>
                <p style={{color:'#94a3b8',fontSize:12,margin:0}}>{e.telefone}{e.bairro?' | '+e.bairro:''}</p>
                {e.zona_eleitoral&&<p style={{color:'#64748b',fontSize:11,margin:0}}>Zona {e.zona_eleitoral}{e.secao_eleitoral?' | Secao '+e.secao_eleitoral:''}</p>}
              </div>
              <div style={{display:'flex',gap:4,marginLeft:6}}>
                {wa&&<a href={'https://wa.me/'+wa} target="_blank" rel="noreferrer" style={{background:'#dcfce7',color:'#16a34a',borderRadius:6,padding:'4px 8px',fontSize:12,textDecoration:'none',fontWeight:600}}>WA</a>}
                <LinkRastreavel eleitor={e} />
                {perfil==='candidato'&&<button onClick={()=>excluir('eleitores',e.id)} style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12}}>X</button>}
              </div>
            </div>);
          })}
        </div>
      </div>

      {perfil==='candidato'&&<div style={{background:'#111827',borderRadius:12,padding:20,border:'1px solid #1f2937'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontWeight:'bold',fontSize:16,color:'#94a3b8',margin:0}}>Liderancas ({liderancas.length})</h3>
          <button onClick={()=>setShowLider(true)} style={{background:'#7c3aed',color:'white',border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}>+ Cadastrar</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {liderancas.map(l=>(<div key={l.id} style={{background:'#1a2332',borderRadius:8,padding:'10px 12px',border:'1px solid #1f2937',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><p style={{fontWeight:'bold',fontSize:13,color:'#f87171',margin:'0 0 2px'}}>{l.nome}</p>{l.telefone&&<p style={{color:'#94a3b8',fontSize:12,margin:0}}>{l.telefone}</p>}{l.bairro&&<p style={{color:'#94a3b8',fontSize:12,margin:0}}>{l.bairro}</p>}{l.demanda&&<p style={{color:'#fbbf24',fontSize:12,margin:0}}>{l.demanda}</p>}</div>
            <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+'/#/cadastro/'+l.id);alert('Link copiado!');}} style={{background:'#dbeafe',color:'#1e40af',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12,fontWeight:'bold',marginRight:4}}>Link</button><button onClick={()=>excluir('liderancas',l.id)} style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12}}>X</button>
          </div>))}
        </div>
      </div>}

      {relatorio&&<RelatorioImpressao {...relatorio} onFechar={()=>setRelatorio(null)} />}
      {showCadastro&&<CadastroEleitorDemo onFechar={()=>setShowCadastro(false)} onCadastrado={fetchAll} />}

      {showLider&&<div style={estiloModal} onClick={e=>e.target===e.currentTarget&&setShowLider(false)}><div style={estiloCard}>
        <h2 style={{color:'#94a3b8',marginBottom:20}}>Cadastrar Lideranca</h2>
        <input style={estiloInput} placeholder="Nome *" value={novaLider.nome} onChange={e=>setNovaLider({...novaLider,nome:e.target.value})} />
        <input style={estiloInput} placeholder="Telefone" value={novaLider.telefone} onChange={e=>setNovaLider({...novaLider,telefone:e.target.value})} />
        <select style={estiloInput} value={novaLider.bairro} onChange={e=>setNovaLider({...novaLider,bairro:e.target.value})}><option value="">Selecione o bairro...</option>{BAIRROS.map(b=><option key={b} value={b}>{b}</option>)}</select>
        <textarea style={{...estiloInput,resize:'vertical'}} placeholder="Demanda" rows={3} value={novaLider.demanda} onChange={e=>setNovaLider({...novaLider,demanda:e.target.value})} />
        <button onClick={cadastrarLider} disabled={loading} style={estiloBotao('#7c3aed')}>{loading?'Salvando...':'Cadastrar Lideranca'}</button>
        <button onClick={()=>setShowLider(false)} style={estiloBotao('#64748b')}>Cancelar</button>
      </div></div>}

      {showReuniao&&<div style={estiloModal} onClick={e=>e.target===e.currentTarget&&setShowReuniao(false)}><div style={estiloCard}>
        <h2 style={{color:'#d97706',marginBottom:20}}>Agendar Reuniao</h2>
        <input style={estiloInput} placeholder="Titulo *" value={novaReuniao.titulo} onChange={e=>setNovaReuniao({...novaReuniao,titulo:e.target.value})} />
        <input style={estiloInput} type="datetime-local" value={novaReuniao.data} onChange={e=>setNovaReuniao({...novaReuniao,data:e.target.value})} />
        <input style={estiloInput} placeholder="Local" value={novaReuniao.local} onChange={e=>setNovaReuniao({...novaReuniao,local:e.target.value})} />
        <input style={estiloInput} placeholder="Endereco" value={novaReuniao.endereco} onChange={e=>setNovaReuniao({...novaReuniao,endereco:e.target.value})} />
        <button onClick={cadastrarReuniao} disabled={loading} style={estiloBotao('#d97706')}>{loading?'Salvando...':'Agendar Reuniao'}</button>
        <button onClick={()=>setShowReuniao(false)} style={estiloBotao('#64748b')}>Cancelar</button>
      </div></div>}
    </div>
  );
}