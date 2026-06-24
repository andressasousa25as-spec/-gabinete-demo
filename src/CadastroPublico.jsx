import { useState, useEffect } from 'react';
import { LISTA_MUNICIPIOS, bairrosDoMunicipio } from './lib/bairros';
import { supabase } from './lib/supabase';
import { gravarResiliente } from './lib/outbox';

const ZONAS_AMAPA = Array.from({ length: 35 }, (_, i) => String(i + 1));

const estiloInput = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '4px',
  boxSizing: 'border-box', background: 'white',
};

const estiloLabel = {
  fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block'
};

export default function CadastroPublico({ liderancaId }) {
  const [lideranca, setLideranca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [termoAceito, setTermoAceito] = useState(false);
  const [tipo, setTipo] = useState('apoiador'); // 'apoiador' | 'lideranca'
  const [config, setConfig] = useState(null);

  useEffect(() => {
    supabase.from('config_candidato').select('nome, cargo, foto_url').limit(1).maybeSingle()
      .then(({ data }) => setConfig(data));
  }, []);

  const [form, setForm] = useState({
    nome: '', telefone: '', email: '', bairro: '',
    endereco: '', municipio: 'Macapá',
    zona_eleitoral: '', secao_eleitoral: '',
    data_nascimento: '',
  });

  useEffect(() => {
    if (liderancaId) {
      supabase.from('liderancas').select('nome, bairro').eq('id', liderancaId).single()
        .then(({ data }) => { setLideranca(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [liderancaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Trocar de município limpa o bairro (a lista de bairros muda).
    if (name === 'municipio') setForm({ ...form, municipio: value, bairro: '' });
    else setForm({ ...form, [name]: value });
  };

  const bairrosDisponiveis = bairrosDoMunicipio(form.municipio);

  const salvar = async () => {
    setErro('');
    if (!form.nome) return setErro('❌ Nome é obrigatório.');
    if (!form.telefone) return setErro('❌ Telefone é obrigatório.');
    if (!form.municipio) return setErro('❌ Município é obrigatório.');
    if (!form.bairro) return setErro('❌ Bairro é obrigatório.');
    // Zona e seção obrigatórias para apoiador E liderança (cadastro igual)
    if (!form.zona_eleitoral) return setErro('❌ Zona eleitoral é obrigatória.');
    if (!form.secao_eleitoral) return setErro('❌ Seção eleitoral é obrigatória.');
    if (!termoAceito) return setErro('❌ Aceite o Termo de Consentimento para continuar.');

    setSalvando(true);

    // Trava: o mesmo telefone não pode se cadastrar duas vezes (apoiador ou liderança)
    const telLimpo = form.telefone.replace(/\D/g, "");
    const { data: existente } = await supabase.from("eleitores").select("id").ilike("telefone", "%" + telLimpo.slice(-8) + "%").limit(1);
    if (existente && existente.length > 0) {
      setErro("Este telefone ja esta cadastrado. Cada pessoa pode ser cadastrada apenas uma vez.");
      setSalvando(false);
      return;
    }

    // Se for liderança, cria também o registro em liderancas e usa o id como auto-referência
    let liderId = liderancaId || null;
    if (tipo === 'lideranca') {
      const { data: novaLider, error: errLider } = await supabase.from('liderancas').insert({
        nome: form.nome, telefone: form.telefone, bairro: form.bairro,
        municipio: form.municipio, endereco: form.endereco, status: 'ativo',
      }).select('id').single();
      if (errLider) { setErro('Erro ao cadastrar liderança: ' + errLider.message); setSalvando(false); return; }
      liderId = novaLider.id;
    }

    // Todos (apoiador e liderança) entram em eleitores com zona/seção
    const r = await gravarResiliente({
      tabela: 'eleitores',
      op: 'insert',
      dados: {
        ...form,
        // normaliza zona/seção: remove zeros à esquerda p/ casar com a referência do TRE (0042 -> 42)
        zona_eleitoral: form.zona_eleitoral?.replace(/^0+/, '') || null,
        secao_eleitoral: form.secao_eleitoral?.replace(/^0+/, '') || null,
        data_nascimento: form.data_nascimento || null,
        lideranca_id: liderId,
        tags: tipo === 'lideranca' ? ['liderança'] : null,
        consentimento_aceito: true,
        consentimento_lgpd: true,
        data_consentimento: new Date().toISOString(),
        versao_termo: '1.0',
      },
    });

    if (r.modo === 'fila') {
      setErro('');
      alert('Sem internet — seu cadastro foi salvo e será enviado automaticamente ao reconectar.');
      setSucesso(true);
    } else {
      setSucesso(true);
    }
    setSalvando(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff' }}>
      <p style={{ color: '#1e40af', fontSize: '18px' }}>⏳ Carregando...</p>
    </div>
  );

  if (sucesso) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        <p style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</p>
        <h2 style={{ color: '#16a34a', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Cadastro realizado!</h2>
        <p style={{ color: '#374151', fontSize: '16px', marginBottom: '8px' }}>Obrigado por apoiar o</p>
        <p style={{ color: '#1e40af', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Gabinete Demo 2026</p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Seus dados foram registrados com segurança conforme a LGPD.</p>
        {lideranca && <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '12px' }}>Indicado por: <strong>{lideranca.nome}</strong></p>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', padding: '20px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '20px' }}>
          {config?.foto_url ? (
            <img src={config.foto_url} alt={config?.nome || 'Deputado Demo'} style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #FFD700', marginBottom: '12px', objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
          ) : (
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #FFD700', background: '#1e40af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '40px', margin: '0 auto 12px' }}>
              {(config?.nome || 'Deputado Demo')[0].toUpperCase()}
            </div>
          )}
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{config?.nome || 'Deputado Demo'}</h1>
          <p style={{ color: '#bfdbfe', fontSize: '14px' }}>{config?.cargo ? `${config.cargo} — AP 2026` : 'Deputado Estadual — AP 2026'}</p>
          {lideranca && <p style={{ color: '#93c5fd', fontSize: '13px', marginTop: '6px' }}>Indicado por: <strong>{lideranca.nome}</strong>{lideranca.bairro ? ` — ${lideranca.bairro}` : ''}</p>}
        </div>

        {/* Formulário */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: '#1e40af', fontSize: '20px', fontWeight: 'bold', marginBottom: '6px' }}>📋 Cadastro {tipo === 'lideranca' ? 'de Liderança' : 'de Apoiador'}</h2>

          {/* Seletor Apoiador / Liderança — só no link genérico (sem liderança).
              No link de uma liderança específica, todo cadastro é de apoiador. */}
          {!liderancaId && (
            <>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '14px' }}>Você quer se cadastrar como:</p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <button type="button" onClick={() => setTipo('apoiador')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: tipo === 'apoiador' ? '2px solid #1e40af' : '1px solid #cbd5e1', background: tipo === 'apoiador' ? '#eff6ff' : 'white', color: tipo === 'apoiador' ? '#1e40af' : '#64748b', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  👤 Apoiador
                </button>
                <button type="button" onClick={() => setTipo('lideranca')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: tipo === 'lideranca' ? '2px solid #1e40af' : '1px solid #cbd5e1', background: tipo === 'lideranca' ? '#eff6ff' : 'white', color: tipo === 'lideranca' ? '#1e40af' : '#64748b', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  ⭐ Liderança
                </button>
              </div>
            </>
          )}

          {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{erro}</div>}

          {/* Nome */}
          <label style={estiloLabel}>Nome Completo *</label>
          <input name="nome" type="text" placeholder="Digite seu nome completo" value={form.nome} onChange={handleChange} style={{ ...estiloInput, marginBottom: '14px' }} />

          {/* Telefone */}
          <label style={estiloLabel}>WhatsApp *</label>
          <input name="telefone" type="tel" placeholder="(96) 99999-9999" value={form.telefone} onChange={handleChange} style={{ ...estiloInput, marginBottom: '14px' }} />

          {/* Email */}
          <label style={estiloLabel}>E-mail (opcional)</label>
          <input name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} style={{ ...estiloInput, marginBottom: '14px' }} />

          {/* Data de nascimento — usada para felicitar o apoiador no aniversário */}
          <label style={estiloLabel}>🎂 Data de nascimento (opcional)</label>
          <input name="data_nascimento" type="date" value={form.data_nascimento} onChange={handleChange} style={{ ...estiloInput, marginBottom: '14px' }} />

          {/* Município — seletor: define qual lista de bairros aparece e ancora
              a pessoa no mapa pelo centro da cidade certa. */}
          <label style={estiloLabel}>Município *</label>
          <select name="municipio" value={form.municipio} onChange={handleChange}
            style={{ ...estiloInput, marginBottom: '14px', color: form.municipio ? '#111' : '#9ca3af' }}>
            <option value="">Selecione o município...</option>
            {LISTA_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Bairro — depende do município. Macapá/Santana têm lista; nos demais
              municípios é texto livre (sem lista de bairros mapeada). */}
          <label style={estiloLabel}>Bairro *</label>
          <input name="bairro" list="lista-bairros" autoComplete="off"
            placeholder={bairrosDisponiveis.length ? 'Digite ou escolha seu bairro' : 'Digite seu bairro'}
            value={form.bairro} onChange={handleChange}
            style={{ ...estiloInput, marginBottom: bairrosDisponiveis.length ? '14px' : '4px' }} />
          <datalist id="lista-bairros">
            {bairrosDisponiveis.map(b => <option key={b} value={b} />)}
          </datalist>
          {!bairrosDisponiveis.length && form.municipio && (
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>
              Digite o nome do seu bairro.
            </p>
          )}

          {/* Endereço */}
          <label style={estiloLabel}>Endereço</label>
          <input name="endereco" type="text" placeholder="Rua, número, complemento" value={form.endereco} onChange={handleChange} style={{ ...estiloInput, marginBottom: '14px' }} />

          {/* Zona e Seção (apoiador e liderança) */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={estiloLabel}>Zona Eleitoral *</label>
              <select name="zona_eleitoral" value={form.zona_eleitoral} onChange={handleChange} style={{ ...estiloInput, marginBottom: 0, color: form.zona_eleitoral ? '#111' : '#9ca3af' }}>
                <option value="">Selecione...</option>
                {ZONAS_AMAPA.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={estiloLabel}>Seção Eleitoral *</label>
              <input name="secao_eleitoral" type="number" placeholder="Ex: 42" min="1" max="9999"
                value={form.secao_eleitoral} onChange={handleChange}
                style={{ ...estiloInput, marginBottom: 0 }} />
            </div>
          </div>

          {/* Termo LGPD */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold', marginBottom: '8px' }}>📋 TERMO DE CONSENTIMENTO — LGPD / TSE</p>
            <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.7', marginBottom: '12px' }}>
              Autorizo o tratamento dos meus dados pessoais — nome, telefone, endereço, zona e seção eleitoral — para fins de <strong>comunicação, relacionamento com apoiadores e convites para eventos</strong> de <strong>Deputado Demo</strong>, nos termos da <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong> e das normas aplicáveis do TSE.
            </p>
            <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.7', marginBottom: '12px' }}>
              Os dados são fornecidos voluntariamente pelo titular e <strong>não são obtidos a partir do cadastro eleitoral da Justiça Eleitoral</strong>. Serão tratados com finalidade específica, <strong>mantidos enquanto durar essa finalidade ou até a revogação do consentimento</strong>, não serão compartilhados com terceiros sem novo consentimento e podem ser revogados a qualquer momento respondendo <strong>SAIR</strong> para o nosso WhatsApp.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={termoAceito} onChange={e => setTermoAceito(e.target.checked)}
                style={{ marginTop: '2px', width: '20px', height: '20px', accentColor: '#1e40af', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500', lineHeight: '1.5' }}>
                Li e aceito o Termo de Consentimento para tratamento dos meus dados pessoais conforme LGPD e normas do TSE. (Versão 1.0 — Maio/2026)
              </span>
            </label>
          </div>

          {/* Botão */}
          <button onClick={salvar} disabled={salvando}
            style={{ width: '100%', padding: '16px', background: salvando ? '#93c5fd' : '#1e40af', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: 'bold', cursor: salvando ? 'not-allowed' : 'pointer' }}>
            {salvando ? '⏳ Cadastrando...' : '✅ Quero apoiar o Deputado Demo!'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
            🔒 Seus dados estão protegidos pela LGPD
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#bfdbfe', fontSize: '12px', marginTop: '16px', paddingBottom: '20px' }}>
          Gabinete Demo 2026
        </p>
      </div>
    </div>
  );
}
