// Lógica pura da apuração (sem dependência de banco/UI).

export function agregarVotos(lancamentos, candidatos) {
  const totais = {};
  for (const c of candidatos) totais[c.id] = 0;
  for (const l of lancamentos) {
    const v = l.votos || {};
    for (const id of Object.keys(v)) {
      totais[id] = (totais[id] || 0) + (Number(v[id]) || 0);
    }
  }
  const ranking = candidatos
    .map((c) => ({ id: c.id, nome: c.nome, eh_nosso: !!c.eh_nosso, votos: totais[c.id] || 0 }))
    .sort((x, y) => y.votos - x.votos);
  const nosso = ranking.find((r) => r.eh_nosso) || null;
  return { totais, ranking, nosso };
}

export function percentualApurado(reportadas, totalEsperado) {
  if (!totalEsperado || totalEsperado <= 0) return 0;
  return Math.round((reportadas / totalEsperado) * 100);
}

export function resolverDuplicidade(existente, novosVotos) {
  if (!existente) return { acao: 'insert', status: 'ok' };
  const a = JSON.stringify(existente.votos || {});
  const b = JSON.stringify(novosVotos || {});
  return { acao: 'update', status: a === b ? 'ok' : 'conferir' };
}
