import { describe, it, expect } from 'vitest';
import { destinatariosDaLideranca, montarMensagemComunicado } from './comunicado.js';

describe('destinatariosDaLideranca', () => {
  const lider = { id: 'L1', nome: 'Maria', telefone: '96999990000' };
  const eleitores = [
    { id: 'E1', nome: 'João', telefone: '96988880000', lideranca_id: 'L1' },
    { id: 'E2', nome: 'Ana', telefone: '96977770000', lideranca_id: 'L2' },
    { id: 'E3', nome: 'Zé', telefone: '', lideranca_id: 'L1' }, // sem telefone -> fora
  ];

  it('inclui a lideranca e os apoiadores dela com telefone', () => {
    const r = destinatariosDaLideranca(lider, eleitores);
    expect(r.map(p => p.id)).toEqual(['L1', 'E1']);
  });

  it('lideranca sem telefone nao entra', () => {
    const r = destinatariosDaLideranca({ id: 'L1', nome: 'Maria', telefone: '' }, eleitores);
    expect(r.map(p => p.id)).toEqual(['E1']);
  });
});

describe('montarMensagemComunicado', () => {
  it('usa template de reuniao com rodape SAIR', () => {
    const msg = montarMensagemComunicado({
      nome: 'João',
      reuniao: { titulo: 'Reunião do bairro', data: '2026-07-01T19:00', local: 'Câmara', endereco: 'Rua A, 100' },
      textoLivre: 'Sua presença é importante.',
    });
    expect(msg).toContain('Olá, João!');
    expect(msg).toContain('Reunião do bairro');
    expect(msg).toContain('Câmara');
    expect(msg).toContain('Rua A, 100');
    expect(msg).toContain('Sua presença é importante.');
    expect(msg).toContain('Responda SAIR');
  });

  it('aceita só texto livre, sem reuniao', () => {
    const msg = montarMensagemComunicado({ nome: 'Ana', textoLivre: 'Bom dia!' });
    expect(msg).toContain('Olá, Ana!');
    expect(msg).toContain('Bom dia!');
    expect(msg).toContain('Responda SAIR');
  });
});
