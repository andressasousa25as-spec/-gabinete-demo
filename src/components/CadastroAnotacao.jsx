import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CadastroAnotacao({ liderancaId, onSuccess }) {
  const [formData, setFormData] = useState({ titulo: '', descricao: '', tipo: '', status: 'Pendente', data_followup: '' });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const { error } = await supabase.from('anotacoes').insert({
        lideranca_id: liderancaId || null,
        titulo: formData.titulo,
        descricao: formData.descricao,
        tipo: formData.tipo || null,
        status: formData.status,
        data_followup: formData.data_followup || null,
      });
      if (error) throw error;
      alert('Anotacao cadastrada!');
      setFormData({ titulo: '', descricao: '', tipo: '', status: 'Pendente', data_followup: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErro('Erro ao salvar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      <input name="titulo" placeholder="Titulo *" value={formData.titulo} onChange={handleChange} required
        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' }} />
      <textarea name="descricao" placeholder="Descricao *" value={formData.descricao} onChange={handleChange} required rows={4}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' }} />
      <input name="tipo" placeholder="Tipo (Reuniao, Telefone...)" value={formData.tipo} onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' }} />
      <select name="status" value={formData.status} onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' }}>
        <option value="Pendente">Pendente</option>
        <option value="Concluido">Concluido</option>
      </select>
      <input type="date" name="data_followup" value={formData.data_followup} onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, boxSizing: 'border-box' }} />
      <button type="submit" disabled={carregando}
        style={{ padding: '12px 30px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
        {carregando ? 'Salvando...' : 'Salvar Anotacao'}
      </button>
    </form>
  );
}