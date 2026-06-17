// Helpers do Comunicado segmentado: monta destinatarios de uma lideranca
// (a lideranca + apoiadores ligados por lideranca_id) e o texto da mensagem.
// Linguagem de pre-candidatura: sem "campanha"/cargo. Rodape de opt-out (LGPD).

export function destinatariosDaLideranca(lideranca, eleitores) {
  const lista = [];
  if (lideranca && lideranca.telefone) {
    lista.push({ id: lideranca.id, nome: lideranca.nome, telefone: lideranca.telefone, tipo: 'lideranca' });
  }
  for (const e of eleitores || []) {
    if (e.lideranca_id === lideranca?.id && e.telefone) {
      lista.push({ id: e.id, nome: e.nome, telefone: e.telefone, tipo: 'apoiador' });
    }
  }
  return lista;
}

function formatarData(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? '' : dt.toLocaleString('pt-BR');
}

export function montarMensagemComunicado({ nome, reuniao, textoLivre }) {
  const linhas = [`Olá, ${nome || 'apoiador'}! 👋`, ''];
  if (reuniao) {
    if (reuniao.titulo) linhas.push(reuniao.titulo);
    const data = formatarData(reuniao.data);
    if (data) linhas.push(`📅 ${data}`);
    const local = [reuniao.local, reuniao.endereco].filter(Boolean).join(' — ');
    if (local) linhas.push(`📍 ${local}`);
    linhas.push('');
  }
  if (textoLivre && textoLivre.trim()) {
    linhas.push(textoLivre.trim());
    linhas.push('');
  }
  linhas.push('Responda SAIR para não receber mais mensagens.');
  return linhas.join('\n');
}
