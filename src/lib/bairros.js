// Centros (centroides) dos bairros — fonte da verdade ÚNICA do app.
//
// AUDITORIA 2026-06-12: a tabela antiga era escrita à mão e tinha ~30 bairros
// com centroide errado (até 15km de desvio — causa raiz dos pins fora do lugar).
// Esta versão foi reconstruída cruzando OpenStreetMap (prioridade; mapeado por
// gente local) com Mapbox (só aceito quando o NOME do bairro bate exato).
// Entradas marcadas [estimado] não existem em nenhuma fonte — valor antigo
// mantido; corrigir caso a caso quando a equipe apontar erro no mapa.
//
// Usados como "rede de segurança" da geocodificação: se o endereço geocodificar
// para um ponto suspeito (no rio, fora do Amapá, longe do bairro), usamos o
// centro do bairro em vez da coordenada errada.
export const COORDS_BAIRROS = {
  'Açaí': [0.0782, -51.0804],
  'Aeroporto Velho': [0.072, -51.125],      // [estimado]
  'Alvorada': [0.037, -51.0924],
  'Amazonas': [0.0884, -51.1098],
  'Americano': [0.052, -51.088],            // [estimado]
  'Área Portuária': [0.038, -51.062],       // [estimado] (a de Santana está na outra tabela)
  'Araxá': [0.0028, -51.0612],
  'Ariri': [0.3221, -51.1288],              // [estimado] comunidade rural de Macapá, Rio Matapi (BR-210 km33)
  'Arsenal': [0.04, -51.058],               // [estimado]
  'Beirol': [0.0165, -51.0642],
  'Bella Ville': [0.0404, -51.1349],
  'Boné Azul': [0.0904, -51.0732],
  'Brasil Novo': [0.0966, -51.0956],
  'Buritizal': [0.0225, -51.0721],
  'Cabralzinho': [0.0222, -51.1144],
  'Cajari': [0.0317, -51.1099],
  'Central': [0.0376, -51.0518],
  'Centro': [0.038, -51.065],
  'Chefe Clodoaldo': [-0.0336, -51.0885],
  'Cidade Nova': [0.0547, -51.0445],
  'Cidade Nova 1': [0.0547, -51.0445],
  'Cidade Nova 2': [0.0547, -51.0445],
  'Conjunto Miracema': [0.0577, -51.0982],
  'Coração': [0.0259, -51.1728],
  'Congós': [0.0103, -51.0963],
  'Distrito Industrial': [0.018, -51.035],  // [estimado] (o de Santana está na outra tabela)
  'Fazendinha': [-0.0358, -51.1216],
  'Fonte Nova': [0.048, -51.082],           // [estimado] (a de Santana está na outra tabela)
  'Fortaleza': [0.03, -51.05],              // [estimado] (a de Santana está na outra tabela)
  'Goiabal': [0.0182, -51.1305],
  'Hospitalidade': [0.062, -51.108],        // [estimado] (a de Santana está na outra tabela)
  'Ilha Mirim': [0.0607, -51.1009],
  'Infraero 1': [0.0711, -51.0649],
  'Infraero 2': [0.0718, -51.0812],
  'Ipê': [0.1019, -51.0619],
  'Jardim América': [0.0458, -51.1109],
  'Jardim das Acácias': [0.065, -51.105],   // [estimado]
  'Jardim Equatorial': [0.0083, -51.0681],
  'Jardim Felicidade': [0.0869, -51.0614],
  'Jardim Felicidade 1': [0.0869, -51.0614],
  'Jardim Felicidade 2': [0.0941, -51.0596],
  'Jardim Marco Zero': [0.0035, -51.0791],
  'Jesus de Nazaré': [0.0477, -51.0637],
  'KM 9': [0.0744, -51.1256],
  'Lago da Vaca': [0.0854, -51.0417],
  'Lagoa Azul': [0.0175, -51.1489],
  'Lagoa dos Índios': [0.065, -51.105],     // [estimado]
  'Laguinho': [0.047, -51.0566],
  'Loteamento Terra Nova': [0.0944, -51.1061],
  'Macapaba': [0.0846, -51.0961],
  'Marabaixo': [0.0374, -51.1239],
  'Marabaixo 1': [0.0374, -51.1239],
  'Marabaixo 2': [0.0413, -51.132],
  'Marabaixo 3': [0.0495, -51.1253],
  'Marabaixo 4': [0.052, -51.13],           // [estimado] (sequência após o Marabaixo 3)
  'Marabaixo 5': [0.054, -51.134],          // [estimado]
  'Marco Zero': [0.0035, -51.0791],
  'Morada das Palmeiras': [0.0835, -51.0862],
  'Muca': [0.0115, -51.0745],
  'Nova Esperança': [0.0292, -51.0821],
  'Novo Buritizal': [0.0189, -51.0842],
  'Novo Horizonte': [0.0942, -51.0502],
  'Pacoval': [0.0581, -51.0547],
  'Palácio das Águas': [0.1059, -51.1143],
  'Pantanal': [0.0711, -51.0456],
  'Parque Aeroportuário': [0.0548, -51.0855],
  'Parque dos Buritis': [0.0722, -51.0896],
  'Pedrinhas': [0.0032, -51.0686],
  'Perpétuo Socorro': [0.0469, -51.0466],
  'Portuário': [0.038, -51.062],            // [estimado]
  'Renascer': [0.0747, -51.0513],
  'Ressaca Beirol': [0.0111, -51.0666],
  'Santa Inês': [0.02, -51.0581],
  'Santa Rita': [0.0375, -51.075],
  'Santo Antônio': [0.045, -51.072],        // [estimado]
  'São José': [0.0394, -51.1446],
  'São Lázaro': [0.0724, -51.0584],
  'São Pedro': [0.05, -51.09],              // [estimado]
  'Sol Nascente': [0.0974, -51.0663],
  'Trem': [0.0254, -51.0618],
  'Tucumã': [0.055, -51.095],               // [estimado]
  'Unifap': [-0.0112, -51.0896],
  'União': [0.048, -51.085],                // [estimado]
  'Universidade': [-0.0112, -51.0896],
  'Vale Verde': [0.022, -51.038],           // [estimado] (o de Santana está na outra tabela)
  'Zerão': [-0.0017, -51.0988],
};

// Bairros de SANTANA (cidade vizinha) — vários têm o MESMO nome de bairros de
// Macapá (Central, Fonte Nova, Novo Horizonte, Nova Brasília...). A escolha da
// tabela é feita pelo município do cadastro.
export const COORDS_BAIRROS_SANTANA = {
  'Acquaville': [-0.0317, -51.1842],
  'Anauerapucu': [-0.0687, -51.26],
  'Área Portuária': [-0.054, -51.1787],
  'Baixada do Ambrósio': [-0.0553, -51.1763],
  'Central': [-0.043, -51.1746],
  'Comercial': [-0.0492, -51.1778],
  'Daniel': [-0.0567, -51.1598],
  'Distrito Industrial': [-0.0153, -51.1834],
  'Elesbão': [-0.0549, -51.188],
  'Fonte Nova': [-0.0197, -51.1738],
  'Fortaleza': [-0.0485, -51.1439],
  'Hospitalidade': [-0.0479, -51.1711],
  'Igarapé da Fortaleza': [-0.0496, -51.1376],
  'Ilha de Santana': [-0.0683, -51.1724],
  'Jardim de Deus': [-0.0088, -51.1781],
  'Murici': [-0.045, -51.1076],
  'Nova Brasília': [-0.039, -51.1648],
  'Novo Horizonte': [-0.0568, -51.1647],
  'Paraíso': [-0.0286, -51.1735],
  'Piçarreira': [-0.0369, -51.1824],
  'Provedor': [-0.0413, -51.1561],
  'Remédios': [-0.0489, -51.1611],
  'Vale Verde': [-0.0497, -51.1029],
  'Vila Amazonas': [-0.0523, -51.1562],
  'Vila Nova União': [-0.0311, -51.1628],
};

// Lista única para selects/datalists de bairro em todo o app (substitui as
// cópias locais de BAIRROS_AMAPA que existiam em 5 arquivos).
export const LISTA_BAIRROS = [...new Set([
  ...Object.keys(COORDS_BAIRROS),
  ...Object.keys(COORDS_BAIRROS_SANTANA),
])].sort((a, b) => a.localeCompare(b, 'pt-BR')).concat('Outro');

// Municípios do Amapá para o seletor do cadastro (nome de exibição).
// Macapá e Santana primeiro (únicos com lista de bairros e os mais relevantes),
// depois os demais em ordem alfabética.
export const LISTA_MUNICIPIOS = [
  'Macapá', 'Santana',
  'Amapá', 'Calçoene', 'Cutias', 'Ferreira Gomes', 'Itaubal',
  'Laranjal do Jari', 'Mazagão', 'Oiapoque', 'Pedra Branca do Amapari',
  'Porto Grande', 'Pracuúba', 'Serra do Navio', 'Tartarugalzinho',
  'Vitória do Jari',
];

// Lista de bairros do município escolhido (nomes de exibição), ordenada.
// Macapá e Santana têm tabela própria; demais municípios não têm lista de
// bairros mapeada → devolve [] (o campo vira texto livre e o trigger do banco
// ancora a pessoa no centro do município).
export function bairrosDoMunicipio(municipio) {
  const ehSantana = String(municipio || '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').includes('santana');
  const ehMacapa = String(municipio || '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').includes('macapa');
  const tabela = ehSantana ? COORDS_BAIRROS_SANTANA : ehMacapa ? COORDS_BAIRROS : null;
  if (!tabela) return [];
  return Object.keys(tabela).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Caixa delimitadora do estado do Amapá (eleição é estadual): minLng,minLat,maxLng,maxLat.
export const AMAPA_BBOX = { latMin: -1.5, latMax: 4.6, lngMin: -55.0, lngMax: -49.8 };

// Centro de Macapá — usado como âncora de proximidade na busca do Mapbox.
export const MACAPA_CENTRO = { latitude: 0.035, longitude: -51.07 };

// Centro dos municípios do Amapá — rede de segurança quando o BAIRRO é
// desconhecido (não está na tabela de centroides). Em vez de deixar uma
// coordenada-lixo cair no rio, ancora a pessoa no centro da cidade dela.
const COORDS_MUNICIPIOS = {
  'macapa': [0.0349, -51.0694],
  'santana': [-0.0583, -51.1811],
  'mazagao': [-0.1153, -51.2894],
  'oiapoque': [3.8413, -51.8347],
  'pedra branca do amapari': [0.7771, -51.9504],
  'serra do navio': [0.9014, -52.0036],
  'laranjal do jari': [-0.8064, -52.5083],
  'vitoria do jari': [-0.9386, -52.4239],
  'porto grande': [0.7128, -51.4136],
  'tartarugalzinho': [1.5061, -50.9097],
  'amapa': [2.0525, -50.7961],
  'calcoene': [2.5036, -50.9508],
  'pracuuba': [1.7392, -50.7906],
  'cutias': [0.9706, -50.8014],
  'itaubal': [0.6022, -50.6997],
  'ferreira gomes': [0.8569, -51.1797],
};
export function centroMunicipio(municipio) {
  const c = COORDS_MUNICIPIOS[normalizar(municipio)];
  return c ? { latitude: c[0], longitude: c[1] } : null;
}

// Distância máxima (km) que um endereço pode estar do centro do seu bairro.
// Bairros de Macapá são pequenos; acima disso, a geocodificação é considerada errada.
export const MAX_KM_DO_BAIRRO = 5;

// Compara nomes ignorando acentos, maiúsculas e espaços extras, para que
// "açai", "AÇAÍ " e "Açaí" achem o mesmo bairro.
function normalizar(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Apelidos/variações de grafia → nome canônico da tabela.
const APELIDOS = {
  'infraero': 'Infraero 1',
  'infraero i': 'Infraero 1',
  'infraero ii': 'Infraero 2',
  'macapaba': 'Macapaba',
  'acai': 'Açaí',
  'marabaixo i': 'Marabaixo 1',
  'marabaixo ii': 'Marabaixo 2',
  'marabaixo iii': 'Marabaixo 3',
  'marabaixo iv': 'Marabaixo 4',
  'marabaixo v': 'Marabaixo 5',
  'jardim felicidade i': 'Jardim Felicidade 1',
  'jardim felicidade ii': 'Jardim Felicidade 2',
  'cidade nova i': 'Cidade Nova 1',
  'cidade nova ii': 'Cidade Nova 2',
  'km9': 'KM 9',
  'km 9': 'KM 9',
  'conjunto habitacional miracema': 'Conjunto Miracema',
  'miracema': 'Conjunto Miracema',
  'renascer 1': 'Renascer',
  'renascer i': 'Renascer',
  'renascer 2': 'Renascer',
  'renascer ii': 'Renascer',
};

function indexar(tabela) {
  const idx = {};
  for (const [nome, coord] of Object.entries(tabela)) idx[normalizar(nome)] = coord;
  for (const [apelido, canonico] of Object.entries(APELIDOS)) {
    if (tabela[canonico]) idx[normalizar(apelido)] = tabela[canonico];
  }
  return idx;
}
const IDX_MACAPA = indexar(COORDS_BAIRROS);
const IDX_SANTANA = indexar(COORDS_BAIRROS_SANTANA);

// Centro do bairro, considerando o município do cadastro (homônimos entre
// Macapá e Santana resolvem para a cidade certa). Sem município = Macapá.
// Se o bairro não existir na tabela do município, tenta na outra (fallback).
export function centroBairro(bairro, municipio) {
  const chave = normalizar(bairro);
  if (!chave) return null;
  const ehSantana = normalizar(municipio).includes('santana');
  const [primaria, secundaria] = ehSantana ? [IDX_SANTANA, IDX_MACAPA] : [IDX_MACAPA, IDX_SANTANA];
  const c = primaria[chave] || secundaria[chave];
  return c ? { latitude: c[0], longitude: c[1] } : null;
}

export function dentroAmapa(lat, lng) {
  if (lat == null || lng == null) return false;
  return lat >= AMAPA_BBOX.latMin && lat <= AMAPA_BBOX.latMax
    && lng >= AMAPA_BBOX.lngMin && lng <= AMAPA_BBOX.lngMax;
}

// Distância aproximada em km entre duas coordenadas (Haversine).
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Valida a coordenada geocodificada e devolve uma posição confiável:
// - coord do endereço, se estiver no Amapá E perto do centro do bairro;
// - senão, o centro do bairro;
// - senão (sem centro de bairro), a coord só se estiver no Amapá;
// - senão, null (não dá pra posicionar com segurança).
export function coordConfiavel(coord, bairro, municipio) {
  const cidade = centroMunicipio(municipio);
  let centro = centroBairro(bairro, municipio);
  // Se o bairro casou num centroide longe (>40km) do município declarado, é
  // homônimo de outra cidade (ex.: "Nova Esperança" existe em Macapá e Oiapoque).
  // O município é o campo mais confiável — descarta o bairro nesse caso.
  if (centro && cidade && distanciaKm(centro.latitude, centro.longitude, cidade.latitude, cidade.longitude) > 40) {
    centro = null;
  }
  const valida = coord && dentroAmapa(coord.latitude, coord.longitude);

  if (valida && centro) {
    const d = distanciaKm(coord.latitude, coord.longitude, centro.latitude, centro.longitude);
    return d <= MAX_KM_DO_BAIRRO ? coord : centro;
  }
  if (centro) return centro;          // coord ruim/ausente, mas temos o bairro
  // Bairro desconhecido: a coord veio de um geocode que não dá pra validar
  // (não achamos o bairro). Ancora no centro do município declarado, evitando
  // que uma coordenada-lixo caia no rio. Perde precisão, mas nunca erra a cidade.
  if (cidade) return cidade;
  if (valida) return coord;           // sem bairro nem município, mas coord no Amapá
  return null;                        // sem como posicionar com segurança
}
