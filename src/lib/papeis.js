export const PAPEIS = ['MASTER', 'CANDIDATO', 'EQUIPE', 'ADMIN'];

const ATRIBUIVEIS = ['EQUIPE', 'ADMIN'];
const FIXOS = ['MASTER', 'CANDIDATO'];

export function papelAtribuivel(papel) {
  return ATRIBUIVEIS.includes(papel);
}

export function papelFixo(papel) {
  return FIXOS.includes(papel);
}
