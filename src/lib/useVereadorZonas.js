import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useVereadorZonas(nrCandidato, municipio) {
  const [zonas, setZonas] = useState(undefined);
  useEffect(() => {
    if (!nrCandidato) { setZonas(null); return; }
    let vivo = true;
    setZonas(undefined);
    supabase.from('vereadores_secao_2024')
      .select('nr_zona, nr_secao, qt_votos')
      .eq('nr_candidato', String(nrCandidato))
      .eq('municipio', municipio?.toUpperCase() ?? '')
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error || !data || data.length === 0) { setZonas(null); return; }
        const zonaMap = {};
        for (const row of data) {
          const z = row.nr_zona;
          if (!zonaMap[z]) zonaMap[z] = { zona: z, votos: 0, secoes: 0 };
          zonaMap[z].votos += row.qt_votos;
          zonaMap[z].secoes += 1;
        }
        setZonas(Object.values(zonaMap).sort((a, b) => b.votos - a.votos));
      })
      .catch(() => { if (vivo) setZonas(null); });
    return () => { vivo = false; };
  }, [nrCandidato, municipio]);
  return { zonas, loading: zonas === undefined, semDados: zonas === null };
}