import { useState } from 'react';
import { LISTA_BAIRROS } from './lib/bairros';
import TermoLGPD from "./TermoLGPD";
import { supabase } from './lib/supabase';

// Bairros de Macapá e Santana - Amapá
const BAIRROS_AMAPA = LISTA_BAIRROS;

// Zonas Eleitorais do Amapá (TRE-AP)
const ZONAS_AMAPA = Array.from({ length: 35 }, (_, i) => String(i + 1));

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '15px',
  boxSizing: 'border-box',
};

export default function CadastroEleitor() {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    bairro: '',
    zona_eleitoral: '',
    secao_eleitoral: '',
  });

  const [aceitouTermo, setAceitouTermo] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const salvarEleitor = async () => {
    setErro('');
    setSucesso(false);

    if (!aceitouTermo) {
      setErro('Você precisa aceitar o Termo de Consentimento para continuar.');
      return;
    }

    if (!formData.nome || !formData.telefone || !formData.bairro) {
      setErro('Por favor, preencha Nome, Telefone e Bairro.');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.from('eleitores').insert({
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || null,
        bairro: formData.bairro,
        zona_eleitoral: formData.zona_eleitoral || null,
        secao_eleitoral: formData.secao_eleitoral || null,
        consentimento_aceito: true,
        data_consentimento: new Date().toISOString(),
        versao_termo: '1.0',
      });

      if (error) throw error;

      setSucesso(true);
      setFormData({ nome: '', telefone: '', email: '', bairro: '', zona_eleitoral: '', secao_eleitoral: '' });
      setAceitouTermo(false);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      setErro('Ocorreu um erro ao salvar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '620px', margin: '40px auto', padding: '30px' }}>
      <h2 style={{ color: '#1e40af', marginBottom: '24px' }}>📋 Cadastro de Apoiador</h2>

      {sucesso && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>
          ✅ Apoiador cadastrado com sucesso!
        </div>
      )}

      {erro && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>
          ⚠️ {erro}
        </div>
      )}

      <form onSubmit={e => e.preventDefault()}>

        {/* Nome */}
        <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Nome Completo *</label>
        <input
          type="text"
          name="nome"
          placeholder="Digite o nome completo"
          value={formData.nome}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Telefone */}
        <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Telefone (WhatsApp) *</label>
        <input
          type="tel"
          name="telefone"
          placeholder="(96) 99999-9999"
          value={formData.telefone}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Email */}
        <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>E-mail (opcional)</label>
        <input
          type="email"
          name="email"
          placeholder="email@exemplo.com"
          value={formData.email}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Bairro - SELECT */}
        <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Bairro *</label>
        <select
          name="bairro"
          value={formData.bairro}
          onChange={handleChange}
          style={{ ...inputStyle, color: formData.bairro ? '#111' : '#9ca3af' }}
        >
          <option value="">Selecione o bairro...</option>
          {BAIRROS_AMAPA.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Zona e Seção */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Zona Eleitoral</label>
            <select
              name="zona_eleitoral"
              value={formData.zona_eleitoral}
              onChange={handleChange}
              style={{ ...inputStyle, marginBottom: 0, color: formData.zona_eleitoral ? '#111' : '#9ca3af' }}
            >
              <option value="">Selecione...</option>
              {ZONAS_AMAPA.map(z => (
                <option key={z} value={z}>Zona {z}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Seção Eleitoral</label>
            <input
              type="number"
              name="secao_eleitoral"
              placeholder="Ex: 0042"
              value={formData.secao_eleitoral}
              onChange={handleChange}
              min="1"
              max="9999"
              style={{ ...inputStyle, marginBottom: 0 }}
            />
          </div>
        </div>

        <TermoLGPD aceito={aceitouTermo} onChange={setAceitouTermo} />

        <button
          type="button"
          onClick={salvarEleitor}
          disabled={carregando}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '16px',
            backgroundColor: carregando ? '#93c5fd' : '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '17px',
            fontWeight: 'bold',
            cursor: carregando ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {carregando ? '⏳ Cadastrando...' : '✅ Cadastrar Apoiador'}
        </button>
      </form>
    </div>
  );
}
