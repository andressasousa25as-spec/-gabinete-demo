import { describe, it, expect } from 'vitest';
import { montarLog } from './logAtividade';

describe('montarLog', () => {
  it('monta a linha de log com user_id e nome do usuario', () => {
    const usuario = { user_id: 'uuid-123', nome: 'Maria' };
    const row = montarLog(usuario, 'Cadastrou apoiador', 'Nome: Joao');
    expect(row).toEqual({
      user_id: 'uuid-123',
      adm_nome: 'Maria',
      acao: 'Cadastrou apoiador',
      detalhes: 'Nome: Joao',
    });
  });
  it('usa fallback quando nome ausente e aceita detalhes vazio', () => {
    const row = montarLog({ user_id: 'uuid-9' }, 'Entrou no sistema');
    expect(row).toEqual({
      user_id: 'uuid-9',
      adm_nome: 'Usuário',
      acao: 'Entrou no sistema',
      detalhes: '',
    });
  });
});
