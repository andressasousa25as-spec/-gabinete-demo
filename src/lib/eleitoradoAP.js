// Eleitorado e abstencao do Amapa — FONTE UNICA das analises eleitorais.
// Fonte: TSE Dados Abertos. Aptos/abstencao 2022 do "perfil de comparecimento e
// abstencao" (1o turno); aptos 2024 do "perfil do eleitor por secao". REAL.
// 2022 = deputado estadual; 2024 = vereadores.

export const ELEITORADO_MUNICIPIO_2022 = {
  "AMAPÁ": 6880,
  "CALÇOENE": 8294,
  "CUTIAS": 5054,
  "FERREIRA GOMES": 6119,
  "ITAUBAL": 7359,
  "LARANJAL DO JARI": 28982,
  "MACAPÁ": 311547,
  "MAZAGÃO": 19191,
  "OIAPOQUE": 21266,
  "PEDRA BRANCA DO AMAPARI": 10163,
  "PORTO GRANDE": 14210,
  "PRACUÚBA": 3740,
  "SANTANA": 83411,
  "SERRA DO NAVIO": 3883,
  "TARTARUGALZINHO": 10391,
  "VITÓRIA DO JARI": 10197
};
export const ELEITORADO_ZONA_2022 = {
  "1": 18914,
  "2": 177085,
  "4": 21266,
  "5": 19191,
  "6": 83411,
  "7": 39179,
  "8": 10391,
  "10": 146875,
  "11": 14046,
  "12": 20329
};
export const TOTAL_APTOS_2022 = 550687;

// Abstencao REAL em % (1o turno 2022)
export const ABSTENCAO_MUNICIPIO_2022 = {
  "AMAPÁ": 20.1,
  "CALÇOENE": 24.3,
  "CUTIAS": 17.7,
  "FERREIRA GOMES": 17.2,
  "ITAUBAL": 18.4,
  "LARANJAL DO JARI": 26.4,
  "MACAPÁ": 18.5,
  "MAZAGÃO": 14.3,
  "OIAPOQUE": 31.6,
  "PEDRA BRANCA DO AMAPARI": 24.9,
  "PORTO GRANDE": 25.2,
  "PRACUÚBA": 17.2,
  "SANTANA": 16.4,
  "SERRA DO NAVIO": 21.5,
  "TARTARUGALZINHO": 21.1,
  "VITÓRIA DO JARI": 23.4
};
export const ABSTENCAO_ZONA_2022 = {
  "1": 21.4,
  "2": 18.0,
  "4": 31.6,
  "5": 14.3,
  "6": 16.4,
  "7": 25.6,
  "8": 21.1,
  "10": 19.1,
  "11": 24.0,
  "12": 22.8
};

export const ELEITORADO_MUNICIPIO_2024 = {
  "AMAPÁ": 7751,
  "CALÇOENE": 9186,
  "CUTIAS": 6936,
  "FERREIRA GOMES": 8288,
  "ITAUBAL": 9910,
  "LARANJAL DO JARI": 29239,
  "MACAPÁ": 310818,
  "MAZAGÃO": 21929,
  "OIAPOQUE": 24120,
  "PEDRA BRANCA DO AMAPARI": 11083,
  "PORTO GRANDE": 15844,
  "PRACUÚBA": 4308,
  "SANTANA": 84930,
  "SERRA DO NAVIO": 4559,
  "TARTARUGALZINHO": 11600,
  "VITÓRIA DO JARI": 10747
};
export const ELEITORADO_ZONA_2024 = {
  "1": 21245,
  "2": 176626,
  "4": 24120,
  "5": 21929,
  "6": 84930,
  "7": 39986,
  "8": 11600,
  "10": 151038,
  "11": 15642,
  "12": 24132
};
export const TOTAL_APTOS_2024 = 571248;

export function eleitoradoMunicipio(municipio, ano = 2022) {
  const t = ano === 2024 ? ELEITORADO_MUNICIPIO_2024 : ELEITORADO_MUNICIPIO_2022;
  return t[municipio] || null;
}
export function eleitoradoZona(zona, ano = 2022) {
  const t = ano === 2024 ? ELEITORADO_ZONA_2024 : ELEITORADO_ZONA_2022;
  return t[String(zona)] || null;
}
