import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useVereadorZonas(nrCandidato, municipio) {
  const [dados, setDados] = useState(undefined);
  useEffect(() => {
    if (!nrCandidato) { setDados(null); return; }
    let vivo = true;
    setDados(undefined);
    supabase.from('vereadores_secao_2024')
      .select('nr_zona, nr_secao, qt_votos')
      .eq('nr_candidato', String(nrCandidato))
      .eq('municipio', municipio?.toUpperCase() ?? '')
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error || !data || data.length === 0) { setDados(null); return; }
        const zonaMap = {};
        for (const row of data) {
          const z = row.nr_zona;
          if (!zonaMap[z]) zonaMap[z] = { zona: z, votos: 0, secoes: 0 };
          zonaMap[z].votos += row.qt_votos;
          zonaMap[z].secoes += 1;
        }
        setDados({
          zonas: Object.values(zonaMap).sort((a, b) => b.votos - a.votos),
          secoes: [...data].sort((a, b) => b.qt_votos - a.qt_votos),
        });
      })
      .catch(() => { if (vivo) setDados(null); });
    return () => { vivo = false; };
  }, [nrCandidato, municipio]);
  return {
    zonas: dados?.zonas ?? null,
    secoes: dados?.secoes ?? null,
    loading: dados === undefined,
    semDados: dados === null,
  };
}