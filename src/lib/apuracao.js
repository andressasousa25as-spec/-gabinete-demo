// Lógica pura da apuração (sem dependência de banco/UI).

export function agregarVotos(lancamentos, candidatos) {
  const totais = {};
  for (const c of candidatos) totais[c.id] = 0;
  for (const l of lancamentos) {
    const v = l.votos || {};
    for (const id of Object.keys(v)) {
      totais[id] = (totais[id] || 0) + (Number(v[id]) || 0);
    }
  }
  const ranking = candidatos
    .map((c) => ({ id: c.id, nome: c.nome, eh_nosso: !!c.eh_nosso, votos: totais[c.id] || 0 }))
    .sort((x, y) => y.votos - x.votos);
  const nosso = ranking.find((r) => r.eh_nosso) || null;
  return { totais, ranking, nosso };
}

export function percentualApurado(reportadas, totalEsperado) {
  if (!totalEsperado || totalEsperado <= 0) return 0;
  return Math.round((reportadas / totalEsperado) * 100);
}

export function resolverDuplicidade(existente, novosVotos) {
  if (!existente) return { acao: 'insert', status: 'ok' };
  const a = JSON.stringify(existente.votos || {});
  const b = JSON.stringify(novosVotos || {});
  return { acao: 'update', status: a === b ? 'ok' : 'conferir' };
}

import { openDB } from 'idb';
import { supabase } from './supabase';

async function filaDB() {
  return openDB('gabinete-apuracao', 1, {
    upgrade(d) { d.createObjectStore('fila', { keyPath: 'id', autoIncrement: true }); },
  });
}

async function uploadFoto(blob, municipio, zona, secao) {
  const path = `boletim-${municipio}-${zona}-${secao}-${Date.now()}.jpg`.replace(/\s+/g, '_');
  const { error } = await supabase.storage.from('boletins').upload(path, blob, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('boletins').getPublicUrl(path).data.publicUrl;
}

async function gravarSecao(dados, fotoUrl) {
  const { data: existente } = await supabase
    .from('apuracao_secao').select('id, votos')
    .eq('municipio', dados.municipio).eq('zona', dados.zona).eq('secao', dados.secao).maybeSingle();
  const r = resolverDuplicidade(existente, dados.votos);
  const linha = { ...dados, foto_url: fotoUrl, status: r.status };
  if (r.acao === 'insert') {
    const { error } = await supabase.from('apuracao_secao').insert(linha);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('apuracao_secao').update({ ...linha, updated_at: new Date().toISOString() }).eq('id', existente.id);
    if (error) throw error;
  }
}

export async function enviarApuracao(dados, fotoBlob) {
  if (navigator.onLine) {
    try {
      const url = fotoBlob ? await uploadFoto(fotoBlob, dados.municipio, dados.zona, dados.secao) : null;
      await gravarSecao(dados, url);
      return { modo: 'online' };
    } catch (_) { /* cai pra fila */ }
  }
  const db = await filaDB();
  await db.add('fila', { dados, fotoBlob, criadoEm: Date.now() });
  return { modo: 'fila' };
}

export async function pendentesApuracao() {
  const db = await filaDB();
  return (await db.getAll('fila')).length;
}

export async function sincronizarApuracao() {
  const db = await filaDB();
  const itens = await db.getAll('fila');
  let enviados = 0;
  for (const item of itens) {
    try {
      const url = item.fotoBlob ? await uploadFoto(item.fotoBlob, item.dados.municipio, item.dados.zona, item.dados.secao) : null;
      await gravarSecao(item.dados, url);
      await db.delete('fila', item.id);
      enviados++;
    } catch (_) { /* mantém na fila */ }
  }
  return { enviados };
}
