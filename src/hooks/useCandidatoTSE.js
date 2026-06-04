import { useState, useEffect } from 'react';
import { CANDIDATOS_TSE } from '../candidatosTSE';
import { supabase } from '../lib/supabase';

export function useCandidatoTSE() {
  const [candidato, setCandidato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeBuscado, setNomeBuscado] = useState('');

  useEffect(() => {
    const buscar = async () => {
      const { data } = await supabase
        .from('config_candidato')
        .select('nome, cargo')
        .limit(1)
        .maybeSingle();

      if (data && data.nome) {
        setNomeBuscado(data.nome);
        const nomeUpper = data.nome.toUpperCase().trim();
        let encontrado = CANDIDATOS_TSE.find(c => c.nome.toUpperCase().trim() === nomeUpper);
        if (!encontrado) {
          const partes = nomeUpper.split(' ').filter(p => p.length > 3);
          encontrado = CANDIDATOS_TSE.find(c =>
            partes.every(p => c.nome.toUpperCase().includes(p))
          );
        }
        setCandidato(encontrado || null);
      }
      setLoading(false);
    };
    buscar();
  }, []);

  return { candidato, loading, nomeBuscado };
}

export function calcularMetas(candidato, metaTotal) {
  if (!candidato) return { municipios: [], zonas: [] };
  const coef = metaTotal / candidato.total;
  const municipios = Object.entries(candidato.municipios)
    .map(([nome, votos]) => ({
      municipio: nome,
      votos2022: votos,
      meta2026: Math.round(votos * coef),
      perc: ((votos / candidato.total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.votos2022 - a.votos2022);

  const zonas = Object.entries(candidato.zonas)
    .map(([zona, votos]) => ({
      zona: 'Zona ' + zona,
      numero: zona,
      votos2022: votos,
      meta2026: Math.round(votos * coef),
      perc: ((votos / candidato.total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.votos2022 - a.votos2022);

  return { municipios, zonas };
}

export const TOTAL_ELEITORES_AP = 578157;

export const MUNICIPIOS_AP = {
  'MACAPA': { eleitores: 322000, abstencao: 0.19 },
  'MACAPÁ': { eleitores: 322000, abstencao: 0.19 },
  'SANTANA': { eleitores: 86000, abstencao: 0.21 },
  'LARANJAL DO JARI': { eleitores: 29000, abstencao: 0.26 },
  'OIAPOQUE': { eleitores: 15000, abstencao: 0.22 },
  'MAZAGÃO': { eleitores: 13000, abstencao: 0.18 },
  'PORTO GRANDE': { eleitores: 12000, abstencao: 0.25 },
  'PEDRA BRANCA DO AMAPARI': { eleitores: 10000, abstencao: 0.25 },
  'TARTARUGALZINHO': { eleitores: 9000, abstencao: 0.23 },
  'VITÓRIA DO JARI': { eleitores: 9000, abstencao: 0.24 },
  'CALÇOENE': { eleitores: 8000, abstencao: 0.24 },
  'FERREIRA GOMES': { eleitores: 6000, abstencao: 0.20 },
  'CUTIAS': { eleitores: 5000, abstencao: 0.22 },
  'ITAUBAL': { eleitores: 5000, abstencao: 0.21 },
  'AMAPÁ': { eleitores: 5000, abstencao: 0.22 },
  'SERRA DO NAVIO': { eleitores: 4000, abstencao: 0.20 },
  'PRACUÚBA': { eleitores: 3000, abstencao: 0.21 },
};
