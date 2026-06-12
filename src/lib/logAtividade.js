import { supabase } from './supabase';

// Função pura: monta a linha do log. Testável sem rede.
export function montarLog(usuario, acao, detalhes = '') {
  return {
    user_id: usuario?.user_id || null,
    adm_nome: usuario?.nome || 'Usuário',
    acao,
    detalhes: detalhes || '',
  };
}

// Efeito: descobre o usuário logado e grava o log.
export async function registrarLog(perfil, acao, detalhes = '') {
  try {
    const row = montarLog(perfil, acao, detalhes);
    await supabase.from('logs_atividades').insert([row]);
  } catch (_e) {
    // log não deve quebrar a ação principal
  }
}
