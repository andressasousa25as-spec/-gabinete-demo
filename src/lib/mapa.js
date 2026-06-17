// Monta um link universal do Google Maps para o endereço de uma reunião.
// No celular abre o app de mapas (com rota); no desktop abre no navegador.
export function linkMapaReuniao(reuniao) {
  if (!reuniao || !reuniao.endereco) return null;
  // Só o endereço (+ estado/país). NÃO inclui "local"/título: é texto livre
  // (ex.: "Câmara", assunto) que atrapalha o Google Maps a achar o ponto.
  const partes = [reuniao.endereco, 'Amapá', 'Brasil'].filter(Boolean);
  const query = encodeURIComponent(partes.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
