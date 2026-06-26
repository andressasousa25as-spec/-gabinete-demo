import { useState, useMemo } from 'react';
import { useCandidatoAnalise } from '../lib/useCandidatoAnalise';
import { TOTAL_APTOS_2022 } from '../lib/eleitoradoAP';

// Dados fixos do Paulinho
const PAULINHO_2018 = {
  votos: 3783, ranking: 32, totalCandidatos: 455, partido: 'PR',
  municipios: 16, zonas: 17
};
const PAULINHO_2022 = {
  nome: 'PAULO ALCEU AVILA RAMOS', partido: 'MDB',
  votos: 4880, ranking: 26, totalCandidatos: 343,
  municipios: 16, zonas: 10,
  totalEleitoresAptos: 550687, totalVotosValidos: 414123,
  abstencao: 107234, abstencaoPerc: 18.55,
  penetracao: 0.9,
  // MDB 2022 dados
  mdbCandidatos: 17, mdbEleitos: 2, mdbVotos: 28900, mdbPerc: 7.0,
  quociente: 17230
};

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

  const ano = anoSelecionado === '2022' ? PAULINHO_2022 : PAULINHO_2018;
  const crescimento = anoSelecionado === '2022'
    ? { val: '+1.097', perc: '+29.0% vs 2018' }
    : { val: '—', perc: 'Sem eleição anterior' };

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
        {/* Seletor de ano */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, border: '1px solid var(--border)', maxWidth: 500 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 8 }}>CANDIDATO</span>
          {['2022', '2018'].map(a => (
            <button key={a} onClick={() => setAnoSelecionado(a)}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: anoSelecionado === a ? '#2563eb' : 'transparent',
                color: anoSelecionado === a ? '#fff' : 'var(--text-muted)' }}>
              {a}
            </button>
          ))}
        </div>

        {/* Card candidato */}
        <div style={{ ...card, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>P</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 16, margin: 0 }}>{paulinho2022?.nome}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>
              {paulinho2022?.cargo} · {paulinho2022?.partido || (anoSelecionado === '2022' ? 'MDB' : 'PR')} · MACAPA/AP
            </p>
          </div>
          <span style={{ ...badge('#7c3aed'), fontSize: 13 }}>{anoSelecionado} · 1° turno</span>
        </div>

        {/* Cards de indicadores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'VOTOS TOTAIS', valor: anoSelecionado === '2022' ? (paulinho2022?.total || 0).toLocaleString('pt-BR') : '3.783',
              sub: anoSelecionado === '2022' ? `${((paulinho2022?.total || 0) / TOTAL_APTOS_2022 * 100).toFixed(1)}% dos aptos` : '0.97% dos validos', cor: '#0ea5e9' },
            { label: 'POSICAO NO RANKING', valor: `${ano.ranking}°`,
              sub: `de ${ano.totalCandidatos} candidatos`, cor: '#8b5cf6' },
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
              {anoSelecionado === '2022'
                ? 'O quociente (~17.230 votos) define quantas cadeiras o PARTIDO/federação ganha — não é a meta de um candidato sozinho. Piso individual: ~1.723 votos (10% do QE), que você já superou. Meta de eleição: a votação do último eleito do seu partido (no MDB, os eleitos tiveram ~8,4 mil em média). A alavanca real é somar votos ao partido/federação.'
                : 'O quociente (~16.325 votos) define as cadeiras do PARTIDO, não de um candidato. Piso individual: ~1.633 votos (10% do QE). Meta de eleição: a votação do último eleito do seu partido. A alavanca é somar votos à legenda.'}
            </p>
          </div>
        </div>

        {/* Meta + Forca do Partido */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
          {/* Meta Eleitoral */}
          <div style={{ ...card }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 12px' }}>META ELEITORAL</p>
            <div style={{ position: 'relative', height: 10, background: 'var(--border)', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '28%', background: '#2563eb', borderRadius: 99 }} />
              <div style={{ position: 'absolute', left: '10%', top: 0, height: '100%', width: '2px', background: '#f59e0b' }} />
              <div style={{ position: 'absolute', left: '49%', top: 0, height: '100%', width: '2px', background: '#10b981' }} />
              <div style={{ position: 'absolute', left: '98%', top: 0, height: '100%', width: '2px', background: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Atual', val: anoSelecionado === '2022' ? '4.9k' : '3.8k', cor: '#2563eb' },
                { label: 'Piso (10% QE)', val: anoSelecionado === '2022' ? '1.7k' : '1.6k', cor: '#f59e0b' },
                { label: 'Meta eleição*', val: anoSelecionado === '2022' ? '8.4k' : '4.9k', cor: '#10b981' },
                { label: 'Quociente', val: anoSelecionado === '2022' ? '17.2k' : '16.3k', cor: 'var(--text-muted)' },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px' }}>{m.label}</p>
                  <p style={{ color: m.cor, fontWeight: 800, fontSize: 16, margin: 0 }}>{m.val}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginTop: 12 }}>
              <p style={{ color: '#166534', fontSize: 12, margin: 0 }}>Acima do piso individual (10% do QE); abaixo da meta de eleição. *Meta = votação do último eleito do partido/federação.</p>
            </div>
          </div>

          {/* Forca do Partido */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0 }}>FORCA DO PARTIDO</p>
              <span style={{ ...badge('#2563eb') }}>{anoSelecionado === '2022' ? 'MDB' : 'PR'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
              {[
                { label: 'Candidatos', val: anoSelecionado === '2022' ? '17' : '36' },
                { label: 'Eleitos', val: anoSelecionado === '2022' ? '2' : '4' },
                { label: 'Votos do partido', val: anoSelecionado === '2022' ? '28.9k' : '44.6k' },
                { label: '% do total', val: anoSelecionado === '2022' ? '7.0%' : '11.4%' },
              ].map((f, i) => (
                <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px' }}>{f.label}</p>
                  <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, margin: 0 }}>{f.val}</p>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '12px 0 0' }}>Media dos eleitos do partido
              <strong style={{ color: 'var(--text)', marginLeft: 8 }}>{anoSelecionado === '2022' ? '8.4k votos' : '4.9k votos'}</strong>
            </p>
          </div>
        </div>

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
                    {['#','Candidato','Partido','Votos','% validos','Diferenca'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos:'1°', nome:'INACIO MONTEIRO MACIEL', partido:'PDT', votos:'14.163', perc:'14.36%', dif:'+9.283' },
                    { pos:'2°', nome:'JACK HOUAT HARB', partido:'SOLIDARIEDADE', votos:'12.539', perc:'12.71%', dif:'+7.659' },
                    { pos:'3°', nome:'ZENEIDE DA SILVA COSTA', partido:'PODE', votos:'11.547', perc:'11.70%', dif:'+6.667' },
                    { pos:'4°', nome:'RUZIELY DE JESUS PONTES', partido:'PDT', votos:'11.069', perc:'11.22%', dif:'+6.189' },
                    { pos:'5°', nome:'ALLINY SOUSA DA ROCHA SERRAO', partido:'UNIAO', votos:'11.017', perc:'11.17%', dif:'+6.137' },
                    { pos:'26°', nome:'PAULO ALCEU AVILA RAMOS', partido:'MDB', votos:'4.880', perc:'1.18%', dif:'—', destaque: true },
                  ].map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: c.destaque ? '#eff6ff' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#64748b' : 'var(--text-muted)', fontWeight: 700 }}>{c.pos}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#1d4ed8' : 'var(--text)', fontWeight: c.destaque ? 700 : 400 }}>{c.nome}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#64748b' : 'var(--text-muted)' }}>{c.partido}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#1e293b' : 'var(--text)', fontWeight: 600 }}>{c.votos}</td>
                      <td style={{ padding: '10px 12px', color: c.destaque ? '#64748b' : 'var(--text-muted)' }}>{c.perc}</td>
                      <td style={{ padding: '10px 12px', color: c.dif === '—' ? (c.destaque ? '#64748b' : 'var(--text-muted)') : '#10b981', fontWeight: 600 }}>{c.dif}</td>
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
