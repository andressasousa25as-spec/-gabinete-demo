// Tema claro/escuro: helpers puros + aplicação no documento.
const CHAVE = 'gd-tema';
const VALIDOS = ['dark', 'light'];

export function proximoTema(atual) {
  return atual === 'light' ? 'dark' : 'light';
}

// Resolve o tema inicial a partir do valor salvo (default escuro).
export function temaInicial(salvo) {
  return VALIDOS.includes(salvo) ? salvo : 'dark';
}

export function lerTema() {
  try { return temaInicial(localStorage.getItem(CHAVE)); }
  catch { return 'dark'; }
}

export function aplicarTema(modo) {
  const m = temaInicial(modo);
  document.documentElement.dataset.theme = m;
  try { localStorage.setItem(CHAVE, m); } catch { /* ignora */ }
  return m;
}

export function alternarTema() {
  return aplicarTema(proximoTema(lerTema()));
}
