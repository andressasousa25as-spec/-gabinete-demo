// Decide se a licença está vencida. `hoje` é injetável para teste.
export function licencaVencida(licenca, hoje = new Date()) {
  if (!licenca) return true;
  if (licenca.status === 'vencido') return true;
  const fim = new Date(licenca.validade + 'T23:59:59Z');
  return fim < hoje;
}
