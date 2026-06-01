import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BAIRROS_AMAPA = ["Acai","Aeroporto Velho","Alvorada","Area Portuaria","Arsenal","Bone Azul","Buritizal","Cabralzinho","Central","Centro","Chefe Clodoaldo","Cidade Nova","Cidade Nova 1","Cidade Nova 2","Coracao","Congos","Distrito Industrial","Fazendinha","Fonte Nova","Fortaleza","Hospitalidade","Igarape da Fortaleza","Infraero 1","Infraero 2","Jardim Equatorial","Jardim Felicidade","Jardim Marco Zero","Jesus de Nazare","Lagoa dos Indios","Laguinho","Marabaixo","Marabaixo 1","Marabaixo 2","Marabaixo 3","Marabaixo 4","Marabaixo 5","Marco Zero","Muca","Nova Brasilia","Nova Esperanca","Novo Buritizal","Novo Horizonte","Pacoval","Pedrinhas","Perpetuo Socorro","Portuario","Renascer","Santa Ines","Santa Rita","Santo Antonio","Sao Jose","Sao Lazaro","Sao Pedro","Trem","Tucuma","Unifap","Uniao","Universidade","Vale Verde","Zerao","Outro"].sort();
const ZONAS_AMAPA = Array.from({ length: 35 }, (_, i) => String(i + 1));
const estiloModal = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const estiloCard = { backgroundColor: 'white', borderRadius: '20px', padding: '32px', color: '#111827', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' };
const estiloInput = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' };
const estiloBotao = (cor) => ({ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: cor, color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' });

export default function CadastroEleitorDemo({ onFechar, onCadastrado }) {
  const [dados, setDados] = useState({ nome: '', telefone: '', bairro: '', zona_eleitoral: '', secao_eleitoral: '', municipio: 'Macapa', lideranca_id: '' });
  const [liderancas, setLiderancas] = useState([]);
  const [termoAceito, setTermoAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    supabase.from('liderancas').select('id, nome').then(({ data }) => { if (data) setLiderancas(data); });
  }, []);
  const salvar = async () => {
    if (!dados.nome || !dados.telefone) return alert('Nome e telefone sao obrigatorios.');
    if (!termoAceito) return alert('Aceite o termo LGPD para continuar.');
    setSalvando(true);
    const payload = { ...dados, lideranca_id: dados.lideranca_id || null, consentimento_lgpd: true, data_consentimento: new Date().toISOString() };
    const { error } = await supabase.from('eleitores').insert([payload]);
    setSalvando(false);
    if (error) { alert('Erro: ' + error.message); return; }
    alert('Eleitor cadastrado!');
    if (onCadastrado) onCadastrado();
    onFechar();
  };
  return (
    <div style={estiloModal} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={estiloCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#1e40af', margin: 0 }}>Cadastrar Eleitor</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>x</button>
        </div>
        <input style={estiloInput} placeholder="Nome completo *" value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} />
        <input style={estiloInput} placeholder="Telefone / WhatsApp *" value={dados.telefone} onChange={e => setDados({ ...dados, telefone: e.target.value })} />
        <select style={estiloInput} value={dados.bairro} onChange={e => setDados({ ...dados, bairro: e.target.value })}>
          <option value="">Selecione o bairro</option>
          {BAIRROS_AMAPA.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
<input style={estiloInput} placeholder="Municipio" value={dados.municipio} onChange={e => setDados({ ...dados, municipio: e.target.value })} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <select style={{ ...estiloInput, flex: 1 }} value={dados.zona_eleitoral} onChange={e => setDados({ ...dados, zona_eleitoral: e.target.value })}>
            <option value="">Zona eleitoral</option>
            {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
          </select>
          <input style={{ ...estiloInput, flex: 1 }} type="number" placeholder="Secao" min="1" max="9999" value={dados.secao_eleitoral} onChange={e => setDados({ ...dados, secao_eleitoral: e.target.value })} />
        </div>
        <select style={estiloInput} value={dados.lideranca_id} onChange={e => setDados({ ...dados, lideranca_id: e.target.value })}>
          <option value="">Vincular a lideranca (opcional)</option>
          {liderancas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: '1px solid #bae6fd' }}>
          <p style={{ fontSize: '13px', color: '#0369a1', margin: '0 0 10px', lineHeight: 1.5 }}>Seus dados serao usados exclusivamente para fins eleitorais, conforme LGPD e Resolucao TSE 23.610/2019.</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
            <input type="checkbox" checked={termoAceito} onChange={e => setTermoAceito(e.target.checked)} style={{ width: '18px', height: '18px' }} />
            Li e aceito os termos de privacidade
          </label>
        </div>
        <button onClick={salvar} disabled={salvando} style={estiloBotao(salvando ? '#94a3b8' : '#1e40af')}>{salvando ? 'Salvando...' : 'Cadastrar Eleitor'}</button>
        <button onClick={onFechar} style={estiloBotao('#64748b')}>Cancelar</button>
      </div>
    </div>
  );
}