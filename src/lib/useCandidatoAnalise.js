import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Função pura testável: traduz a linha do banco no estado das telas.
export function montarEstado(data) {
  if (data === undefined) return { candidato: null, loading: true, semDados: false };
  if (data === null) return { candidato: null, loading: false, semDados: true };
  return { candidato: data, loading: false, semDados: false };
}

// Cache de módulo: busca a linha uma vez por carregamento do app.
let _promessa = null;
function carregar() {
  if (!_promessa) {
    _promessa = supabase
      .from('analise_candidato')
      .select('ano,cargo,nome,partido,numero,total,municipios,zonas,secoes')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data ?? null)
      .catch(() => null);
  }
  return _promessa;
}

export function useCandidatoAnalise() {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    carregar().then(d => { if (vivo) setData(d); });
    return () => { vivo = false; };
  }, []);
  return montarEstado(data);
}
