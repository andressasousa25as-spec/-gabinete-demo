// Lógica pura do comparativo interno (sem banco/UI).
export function montarComparativo(lista) {
  const referencia = lista.find((c) => c.eh_nosso) || null;
  const base = referencia ? referencia.votos : 0;
  const adversarios = lista
    .filter((c) => !c.eh_nosso)
    .map((c) => ({
      ...c,
      diff: c.votos - base,
      comparacaoDireta: !!referencia && c.abrangencia === referencia.abrangencia,
    }))
    .sort((a, b) => b.votos - a.votos);
  return { referencia, adversarios, semReferencia: !referencia };
}
