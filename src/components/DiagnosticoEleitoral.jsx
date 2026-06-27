import { useState, useMemo } from 'react';
import { useCandidatoAnalise } from '../lib/useCandidatoAnalise';
import { TOTAL_APTOS_2022 } from '../lib/eleitoradoAP';
import { CANDIDATOS_TSE } from '../candidatosTSE';

// Votos válidos de Deputado Estadual no AP em 2022 (eleição inteira, não por candidato)
const VALIDOS_DEP_2022 = 414123;

const REGIOES = {
  'Sul do Amapa': ['MACAPÁ','SANTANA','MAZAGÃO','PORTO GRANDE','ITAUBAL','CUTIAS','PEDRA BRANCA DO AMAPARI','FERREIRA GOMES','SERRA DO NAVIO'],
  'Norte do Amapa': ['AMAPÁ','CALÇOENE','OIAPOQUE','LARANJAL DO JARI','VITÓRIA DO JARI','PRACUÚBA','TARTARUGALZINHO']
};

function getMunicipioRegiao(mun) {
  for (const [reg, lista] of Object.entries(REGIOES)) {
    if (lista.includes(mun)) return reg;
  }
  return 'Sul do Amapa';
}

export default function DiagnosticoEleitoral({ onVoltar }) {
  const [anoSelecionado, setAnoSelecionado] = useState('2022');

  const { candidato: paulinho2022, loading, semDados } = useCandidatoAnalise();

  const dadosMunicipios = useMemo(() => {
    if (!paulinho2022) return [];
    const mapa = {};
    for (const s of paulinho2022.secoes || []) {
      if (!mapa[s.municipio]) mapa[s.municipio] = { municipio: s.municipio, votos: 0, zonas: new Set() };
      mapa[s.municipio].votos += s.votos;
      mapa[s.municipio].zonas.add(s.zona);
    }
    return Object.values(mapa)
      .map(m => ({ ...m, zonas: m.zonas.size }))
      .sort((a, b) => b.votos - a.votos);
  }, [paulinho2022]);

  const totalVotos2022 = dadosMunicipios.reduce((s, m) => s + m.votos, 0);

  const dadosRegioes = useMemo(() => {
    const mapa = {};
    for (const m of dadosMunicipios) {
      const reg = getMunicipioRegiao(m.municipio);
      if (!mapa[reg]) mapa[reg] = 0;
      mapa[reg] += m.votos;
    }
    return Object.entries(mapa)
      .map(([reg, votos]) => ({ reg, votos, perc: Math.round((votos / totalVotos2022) * 100) }))
      .sort((a, b) => b.votos - a.votos);
  }, [dadosMunicipios, totalVotos2022]);

  // Ranking 2022 derivado da lista TSE: posição por nº de votos (genérico p/ qualquer candidato)
  const rank2022 = useMemo(() => {
    const lista = CANDIDATOS_TSE.filter(c => c.cargo === 'DEPUTADO ESTADUAL').sort((a, b) => b.total - a.total);
    const meu = paulinho2022?.total || 0;
    const pos = lista.filter(c => c.total > meu).length + 1;
    return { pos, total: lista.length, lista };
  }, [paulinho2022]);

  // Tabela de concorrentes: top 5 por votos + a linha do candidato configurado
  const concorrentes = useMemo(() => {
    const fmtPerc = v => ((v / VALIDOS_DEP_2022) * 100).toFixed(2) + '%';
    const top = rank2022.lista.slice(0, 5).map((c, i) => ({
      pos: (i + 1) + '°', nome: c.nome, votos: c.total.toLocaleString('pt-BR'), perc: fmtPerc(c.total),
      destaque: rank2022.pos === i + 1,
    }));
    if (rank2022.pos > 5) {
      const meu = paulinho2022?.total || 0;
      top.push({ pos: rank2022.pos + '°', nome: paulinho2022?.nome, votos: meu.toLocaleString('pt-BR'), perc: fmtPerc(meu), destaque: true });
    }
    return top;
  }, [rank2022, paulinho2022]);

  const crescimento = { val: '—', perc: 'sem base anterior' };

  // Cores estilo EleitorAI
  const card = { background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' };
  const badge = (cor) => ({ background: cor, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando análise…</div>
  );
  if (semDados) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 32px' }}>
      <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>Voltar</button>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, border: '1px solid var(--border)', maxWidth: 560 }}>
        <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>Análise eleitoral indisponível</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>Este candidato não tem histórico de votação no TSE (ou ainda não foi importado). O restante do sistema — cadastro, mapa e comunicação — funciona normalmente.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 40px 0' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--surface)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Voltar
        </button>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, margin: 0 }}>Diagnostico Eleitoral</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>Analise automatica do territorio — zonas, secoes e potencial de votos</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* Card candidato */}
        <div style={{ ...card, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>{(paulinho2022?.nome || '?')[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 16, margin: 0 }}>{paulinho2022?.nome}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>
              {paulinho2022?.cargo} · {paulinho2022?.partido || '—'} · MACAPA/AP
            </p>
          </div>
          <span style={{ ...badge('#7c3aed'), fontSize: 13 }}>{anoSelecionado} · 1° turno</span>
        </div>

        {/* Cards de indicadores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'VOTOS TOTAIS', valor: anoSelecionado === '2022' ? (paulinho2022?.total || 0).toLocaleString('pt-BR') : '3.783',
              sub: anoSelecionado === '2022' ? `${((paulinho2022?.total || 0) / TOTAL_APTOS_2022 * 100).toFixed(1)}% dos aptos` : '0.97% dos validos', cor: '#0ea5e9' },
            { label: 'POSICAO NO RANKING', valor: `${rank2022.pos}°`,
              sub: `de ${rank2022.total} candidatos`, cor: '#8b5cf6' },
            { label: anoSelecionado === '2022' ? 'CRESCIMENTO' : 'VARIACAO',
              valor: crescimento.val, sub: crescimento.perc, cor: '#10b981' },
            { label: 'PENETRACAO TOTAL', valor: anoSelecionado === '2022' ? `${((paulinho2022?.total || 0) / TOTAL_APTOS_2022 * 100).toFixed(1)}%` : '0.0%',
              sub: 'dos aptos votaram em você', cor: '#f59e0b' },
            { label: 'ABSTENCAO TOTAL', valor: anoSelecionado === '2022' ? '19.5%' : '0.0%',
              sub: anoSelecionado === '2022' ? '107.398 ausentes' : 'Sem dado', cor: '#ef4444' },
          ].map((c, i) => (
            <div key={i} style={{ ...card }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>{c.label}</p>
              <p style={{ color: c.cor, fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>{c.valor}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Quociente Eleitoral */}
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <div>
            <p style={{ color: '#92400e', fontWeight: 700, fontSize: 14, margin: 0 }}>Quociente Eleitoral — como se elege de fato</p>
            <p style={{ color: '#78350f', fontSize: 13, margin: '2px 0 0', lineHeight: 1.6 }}>
              O quociente eleitoral (~17.230 votos em 2022) define quantas cadeiras o PARTIDO/federação ganha — não é a meta de um candidato sozinho. Piso individual: ~1.723 votos (10% do QE). A alavanca real é somar votos ao partido/federação.
            </p>
          </div>
        </div>

        {/* Meta Eleitoral — calculada a partir dos votos do candidato configurado */}
        {(() => {
          const QE_2022 = 17230;
          const meuTotal = paulinho2022?.total || 0;
          const pisoQE = Math.round(QE_2022 * 0.1);
          const pctAtual = Math.min(100, Math.round((meuTotal / QE_2022) * 100));
          const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
          return (
            <div style={{ ...card, marginBottom: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 12px' }}>META ELEITORAL</p>
              <div style={{ position: 'relative', height: 10, background: 'var(--border)', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pctAtual + '%', background: '#2563eb', borderRadius: 99 }} />
                <div style={{ position: 'absolute', left: '10%', top: 0, height: '100%', width: '2px', background: '#f59e0b' }} />
                <div style={{ position: 'absolute', left: '100%', top: 0, height: '100%', width: '2px', background: 'var(--text-muted)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Atual', val: fmtK(meuTotal), cor: '#2563eb' },
                  { label: 'Piso (10% QE)', val: fmtK(pisoQE), cor: '#f59e0b' },
                  { label: 'Quociente', val: fmtK(QE_2022), cor: 'var(--text-muted)' },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px' }}>{m.label}</p>
                    <p style={{ color: m.cor, fontWeight: 800, fontSize: 16, margin: 0 }}>{m.val}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginTop: 12 }}>
                <p style={{ color: '#166534', fontSize: 12, margin: 0 }}>{meuTotal >= pisoQE ? 'Acima' : 'Abaixo'} do piso individual (10% do QE, ~{fmtK(pisoQE)} votos). A meta de eleição depende da votação do partido/federação.</p>
              </div>
            </div>
          );
        })()}

        {/* Regioes + Municipios mais fortes */}
        {anoSelecionado === '2022' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Regioes */}
            <div style={{ ...card }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>REGIOES MAIS FORTES</p>
              {dadosRegioes.map((r, i) => (
                <div key={r.reg} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{i === 0 ? '🥇' : '🥈'}</span>
                      <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{r.reg}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{(r.votos/1000).toFixed(1)}k v</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{r.perc}%</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.perc}%`, background: '#2563eb', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Municipios mais fortes */}
            <div style={{ ...card }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>MUNICIPIOS MAIS FORTES</p>
              {dadosMunicipios.slice(0, 10).map((m, i) => {
                const perc = Math.round((m.votos / totalVotos2022) * 100);
                const medals = ['🥇','🥈','🥉'];
                return (
                  <div key={m.municipio} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 20, textAlign: 'center', fontSize: 13 }}>{medals[i] || <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i+1}</span>}</span>
                    <span style={{ flex: 1, color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>
                      {m.municipio.charAt(0) + m.municipio.slice(1).toLowerCase()} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>AP</span>
                    </span>
                    <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{m.votos >= 1000 ? (m.votos/1000).toFixed(1)+'k' : m.votos} v</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 36, textAlign: 'right' }}>{perc}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Concorrentes 2022 */}
        {anoSelecionado === '2022' && (
          <div style={{ ...card }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 16px' }}>CONCORRENTES — Ordenado por posicao 2022</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['#','Candidato','Votos','% válidos'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {concorrentes.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: c.destaque ? '#eff6ff' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#64748b' : 'var(--text-muted)', fontWeight: 700 }}>{c.pos}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#1d4ed8' : 'var(--text)', fontWeight: c.destaque ? 700 : 400 }}>{c.nome}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#1e293b' : 'var(--text)', fontWeight: 600 }}>{c.votos}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#64748b' : 'var(--text-muted)' }}>{c.perc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
