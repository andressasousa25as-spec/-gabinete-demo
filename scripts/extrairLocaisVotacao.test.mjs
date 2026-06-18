import { describe, it, expect } from 'vitest';
import { extrair } from './extrairLocaisVotacao.mjs';

const HEADER = 'DT_GERACAO;HH;AA;DT;DS;TURNO;SG_UF;CDMUN;NM_MUNICIPIO;NR_ZONA;NR_SECAO;A;B;C;NR_LOCAL;NM_LOCAL_VOTACAO;E;F;DS_ENDERECO;NM_BAIRRO';
const linhaAP = '"x";"y";2024;"z";"w";1;"AP";"06033";"CALCOENE";1;85;1;"P";-1;1015;"ESCOLA TESTE";1;"Conv";"AV X, 1";"CENTRO"';
const linhaSP = '"x";"y";2024;"z";"w";1;"SP";"00001";"SAO PAULO";1;85;1;"P";-1;1015;"OUTRA";1;"Conv";"R Y";"BAIRRO"';

describe('extrair', () => {
  it('mapeia seção do AP por zona-secao', () => {
    const m = extrair([HEADER, linhaAP].join('\n'));
    expect(m['1-85']).toEqual({ local: 'ESCOLA TESTE', bairro: 'CENTRO', municipio: 'CALCOENE' });
  });
  it('ignora linhas de outros estados', () => {
    const m = extrair([HEADER, linhaSP].join('\n'));
    expect(m['1-85']).toBeUndefined();
  });
});
