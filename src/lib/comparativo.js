// Lógica pura do comparativo interno (sem banco/UI).
// `referencia` = candidato configurado { nome, votos, cargo_ultima, abrangencia }.
// A lista do banco contém apenas os ADVERSÁRIOS (linhas legadas eh_nosso são ignoradas).
export function montarComparativo(lista, referencia) {
  const base = referencia?.votos || 0;
  const refAbr = referencia?.abrangencia || 'Estado';
  const adversarios = (lista || [])
    .filter((c) => !c.eh_nosso)
    .map((c) => ({
      ...c,
      diff: c.votos - base,
      comparacaoDireta: c.abrangencia === refAbr,
    }))
    .sort((a, b) => b.votos - a.votos);
  return { referencia: referencia || null, adversarios, semReferencia: !referencia };
}
