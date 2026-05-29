export const ELEITORES = [
  { id: 1, nome: 'Maria das Graças Silva', telefone: '96981110001', bairro: 'Laguinho', zona: '2', secao: '0045', latitude: 0.0401, longitude: -51.0589, lideranca_id: 1 },
  { id: 2, nome: 'João Carlos Ferreira', telefone: '96981110002', bairro: 'Perpétuo Socorro', zona: '10', secao: '0144', latitude: 0.0711, longitude: -51.0649, lideranca_id: 1 },
  { id: 3, nome: 'Ana Paula Souza', telefone: '96981110003', bairro: 'Santa Inês', zona: '2', secao: '0620', latitude: 0.0225, longitude: -51.0721, lideranca_id: 2 },
  { id: 4, nome: 'Carlos Eduardo Lima', telefone: '96981110004', bairro: 'Novo Horizonte', zona: '5', secao: '0312', latitude: 0.0869, longitude: -51.0614, lideranca_id: 2 },
  { id: 5, nome: 'Fernanda Costa Alves', telefone: '96981110005', bairro: 'Buritizal', zona: '3', secao: '0201', latitude: 0.0349, longitude: -51.0694, lideranca_id: 3 },
  { id: 6, nome: 'Roberto Nascimento', telefone: '96981110006', bairro: 'Muca', zona: '7', secao: '0089', latitude: 0.0115, longitude: -51.0745, lideranca_id: 3 },
  { id: 7, nome: 'Luciana Mendes Ramos', telefone: '96981110007', bairro: 'Infraero 1', zona: '10', secao: '0144', latitude: 0.0711, longitude: -51.0649, lideranca_id: 1 },
  { id: 8, nome: 'Paulo Henrique Dias', telefone: '96981110008', bairro: 'Jesus de Nazaré', zona: '4', secao: '0178', latitude: 0.0480, longitude: -51.0502, lideranca_id: 2 },
  { id: 9, nome: 'Simone Barbosa Cruz', telefone: '96981110009', bairro: 'Cidade Nova', zona: '8', secao: '0456', latitude: 0.0756, longitude: -51.0389, lideranca_id: 3 },
  { id: 10, nome: 'Alexandre Torres', telefone: '96981110010', bairro: 'Congós', zona: '6', secao: '0267', latitude: 0.0190, longitude: -51.0830, lideranca_id: 1 },
  { id: 11, nome: 'Patrícia Oliveira', telefone: '96981110011', bairro: 'Zerão', zona: '9', secao: '0523', latitude: -0.0100, longitude: -51.0712, lideranca_id: 2 },
  { id: 12, nome: 'Marcos Vinícius Pinto', telefone: '96981110012', bairro: 'Marabaixo', zona: '1', secao: '0033', latitude: 0.0180, longitude: -51.0350, lideranca_id: 3 },
  { id: 13, nome: 'Juliana Freitas', telefone: '96981110013', bairro: 'Universidade', zona: '11', secao: '0634', latitude: -0.0250, longitude: -51.0689, lideranca_id: 1 },
  { id: 14, nome: 'Diego Santos Moura', telefone: '96981110014', bairro: 'Açaí', zona: '3', secao: '0201', latitude: 0.0600, longitude: -51.0550, lideranca_id: 2 },
  { id: 15, nome: 'Cristina Vale Pereira', telefone: '96981110015', bairro: 'Boné Azul', zona: '5', secao: '0312', latitude: 0.0780, longitude: -51.0480, lideranca_id: 3 },
];

export const LIDERANCAS = [
  { id: 1, nome: 'Andressa Geany Fonseca', telefone: '96988880001', bairro: 'Perpétuo Socorro', demanda: 'Pavimentação da Rua das Flores', eleitores: 5 },
  { id: 2, nome: 'José Ribamar Costa', telefone: '96988880002', bairro: 'Cidade Nova', demanda: 'Reforma da UBS do bairro', eleitores: 5 },
  { id: 3, nome: 'Raimunda Ferreira Lima', telefone: '96988880003', bairro: 'Buritizal', demanda: 'Iluminação pública na Av. Central', eleitores: 5 },
];

export const REUNIOES = [
  { id: 1, titulo: 'Reunião com lideranças do Laguinho', data: '2026-06-05T09:00', local: 'Associação de Moradores', status: 'agendada' },
  { id: 2, titulo: 'Visita à UBS Perpétuo Socorro', data: '2026-06-08T14:00', local: 'UBS Perpétuo Socorro', status: 'agendada' },
  { id: 3, titulo: 'Plenária Zona Norte', data: '2026-06-12T19:00', local: 'Câmara Municipal', status: 'agendada' },
  { id: 4, titulo: 'Caminhada Cidade Nova', data: '2026-05-20T08:00', local: 'Praça da Cidadania', status: 'realizada' },
  { id: 5, titulo: 'Entrega de cestas Zerão', data: '2026-05-15T10:00', local: 'Escola Estadual', status: 'realizada' },
];

export const METRICAS = {
  totalEleitores: 15,
  metaEleitores: 50000,
  totalLiderancas: 3,
  metaLiderancas: 200,
  reunioesRealizadas: 2,
  reunioesAgendadas: 3,
  bairrosCobertos: 12,
};
