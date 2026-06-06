import { supabase } from './supabase';
export const gerarRef = (nome, telefone) => {
  const base = (nome + telefone).toLowerCase().replace(/[^a-z0-9]/g, '');
  return base.slice(0, 20) + Math.random().toString(36).slice(2, 6);
};
export const registrarClique = async ({ ref, nomeEleitor, telefone, utmSource }) => {
  try {
    await supabase.from('links_rastreados').insert({ ref, nome_eleitor: nomeEleitor, telefone, utm_source: utmSource || 'gabinete', utm_campaign: ref, user_agent: navigator.userAgent });
  } catch (err) { console.warn('[rastreamento]', err.message); }
};
export const capturarRefUrl = async () => {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) return;
  try { await supabase.from('links_rastreados').insert({ ref, utm_source: 'link_direto', utm_campaign: ref, user_agent: navigator.userAgent }); } catch (err) { console.warn(err.message); }
};
export const gerarLinkEleitor = (ref) => window.location.origin + '?ref=' + ref;
export const gerarLinkWhatsApp = (telefone, nomeEleitor, ref) => {
  // Mensagem personalizada — rastreio ja feito via registrarClique antes de abrir o WhatsApp
  const primeiroNome = nomeEleitor ? nomeEleitor.split(' ')[0] : nomeEleitor;
  const texto = 'Ola ' + primeiroNome + '! Aqui e a equipe do Dep. Paulinho Ramos 2026. Estamos em contato para fortalecer nossa campanha pelo Amapa. Conte conosco!';
  return 'https://wa.me/55' + telefone.replace(/\D/g, '') + '?text=' + encodeURIComponent(texto);
};