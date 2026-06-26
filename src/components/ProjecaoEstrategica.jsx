import { useState, useMemo } from 'react';
import { useCandidatoAnalise } from '../lib/useCandidatoAnalise';

const MUNICIPIOS_META = {
  'MACAPÁ':      { meta2026: 4200, prioridade: 1, classificacao: 'Forte' },
  'SANTANA':     { meta2026: 900,  prioridade: 2, classificacao: 'Media' },
  'PEDRA BRANCA DO AMAPARI': { meta2026: 300, prioridade: 3, classificacao: 'Media' },
  'PORTO GRANDE':{ meta2026: 220,  prioridade: 4, classificacao: 'Media' },
  'FERREIRA GOMES':{ meta2026: 200, prioridade: 5, classificacao: 'Media' },
  'LARANJAL DO JARI':{ meta2026: 250, prioridade: 6, classificacao: 'Baixa' },
  'MAZAGÃO':     { meta2026: 120,  prioridade: 7, classificacao: 'Baixa' },
  'CALÇOENE':    { meta2026: 100,  prioridade: 8, classificacao: 'Baixa' },
  'OIAPOQUE':    { meta2026: 120,  prioridade: 9, classificacao: 'Baixa' },
  'VITÓRIA DO JARI':{ meta2026: 80, prioridade: 10, classificacao: 'Baixa' },
};

function calcScore(votos2022, meta) {
  const pct = votos2022 / meta;
  if (pct >= 0.8) return { score: 85, label: 'FORTE', cor: '#10b981' };
  if (pct >= 0.5) return { score: 65, label: 'MEDIA', cor: '#f59e0b' };
  if (pct >= 0.2) return { score: 45, label: 'BAIXA', cor: '#f97316' };
  return { score: 20, label: 'AUSENTE', cor: '#ef4444' };
}

export default function ProjecaoEstrategica({ onVoltar }) {
  const [meta, setMeta] = useState(7000);
  const [metaInput, setMetaInput] = useState('7000');
  const [mostraCandidato, setMostraCandidato] = useState(false);
  const [candidatoCustom, setCandidatoCustom] = useState({
    nome: '', partido: '', municipio: 'Macapá', votos2022: '', meta2026: '',
    cargo: 'Deputado Estadual', uf: 'AP'
  });
  const [modoCustom, setModoCustom] = useState(false);

  // Candidato configurado por cliente (tabela analise_candidato) — genérico, sem o bundle TSE.
  const { candidato: cand, loading, semDados } = useCandidatoAnalise();

  const dadosMunicipios = useMemo(() => {
    const mun = cand?.municipios || {};
    return Object.entries(mun)
      .map(([municipio, votos]) => ({ municipio, votos2022: Number(votos) || 0 }))
      .sort((a, b) => b.votos2022 - a.votos2022);
  }, [cand]);

  const total2022 = dadosMunicipios.reduce((s, m) => s + m.votos2022, 0);
  const crescimento = meta - total2022;
  const pctCrescimento = ((crescimento / total2022) * 100).toFixed(1);

  const municipiosComMeta = dadosMunicipios.map(m => {
    const metaMun = Math.round((m.votos2022 / total2022) * meta);
    const { score, label, cor } = calcScore(m.votos2022, metaMun);
    const falta = Math.max(0, metaMun - m.votos2022);
    return { ...m, metaMun, score, label, cor, falta };
  });

  const scoreViabilidade = () => {
    const base = Math.min(25, Math.round((total2022 / 17230) * 25));
    const crescPts = Math.min(20, Math.round((1097 / 1097) * 20));
    const partido = 15;
    const expansao = Math.min(20, Math.round((2200 / 5000) * 20));
    const digital = 4;
    return { base, crescPts, partido, expansao, digital, total: base + crescPts + partido + expansao + digital };
  };

  const sv = scoreViabilidade();
  const classif = sv.total >= 70 ? { label: 'FAVORITO', cor: '#10b981' } :
                  sv.total >= 55 ? { label: 'COMPETITIVO', cor: '#f59e0b' } :
                  { label: 'DESAFIADOR', cor: '#ef4444' };

  const card = (bg, border) => ({ background: bg || 'var(--surface)', borderRadius: 12, padding: 20, border: `1px solid ${border || 'var(--border)'}`, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' });

  if (!modoCustom && loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Carregando candidato…</div>;
  if (!modoCustom && semDados) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 40 }}>
      <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>Voltar</button>
      <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>Nenhum candidato de análise configurado.</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Importe o candidato (tabela <code>analise_candidato</code>) ou use “+ Outro Candidato” para análise manual.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--surface)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Voltar</button>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 800, margin: 0 }}>Projecao Estrategica 2026</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>Base 2022 → Meta 2026 · Distribuicao por municipio e score de viabilidade</p>
        </div>
        <button onClick={() => setMostraCandidato(!mostraCandidato)}
          style={{ marginLeft: 'auto', background: '#1e40af', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          {mostraCandidato ? 'Fechar' : '+ Outro Candidato'}
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* Formulario candidato custom */}
        {mostraCandidato && (
          <div style={{ ...card('#eff6ff', '#bfdbfe'), marginBottom: 24 }}>
            <p style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>✏️ Analisar Outro Candidato</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Nome completo', key: 'nome', placeholder: 'Ex: João da Silva' },
                { label: 'Partido', key: 'partido', placeholder: 'Ex: MDB' },
                { label: 'Município base', key: 'municipio', placeholder: 'Ex: Macapá' },
                { label: 'Votos 2022', key: 'votos2022', placeholder: 'Ex: 3500' },
                { label: 'Meta 2026', key: 'meta2026', placeholder: 'Ex: 7000' },
                { label: 'Cargo', key: 'cargo', placeholder: 'Ex: Deputado Estadual' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input value={candidatoCustom[f.key]} onChange={e => setCandidatoCustom({ ...candidatoCustom, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
              ))}
            </div>
            <button onClick={() => { setModoCustom(true); setMostraCandidato(false); if (candidatoCustom.meta2026) { setMeta(parseInt(candidatoCustom.meta2026)); setMetaInput(candidatoCustom.meta2026); } }}
              style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              Gerar Projecao
            </button>
            {modoCustom && <button onClick={() => setModoCustom(false)} style={{ marginLeft: 10, background: 'var(--text-muted)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Voltar ao candidato</button>}
          </div>
        )}

        {/* Candidato */}
        <div style={{ ...card('var(--surface)', 'var(--border)'), marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20 }}>
            {modoCustom && candidatoCustom.nome ? candidatoCustom.nome[0].toUpperCase() : (cand?.nome?.[0]?.toUpperCase() || '?')}
          </div>
          <div>
            <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, margin: 0 }}>
              {modoCustom && candidatoCustom.nome ? candidatoCustom.nome.toUpperCase() : (cand?.nome || '—')}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>
              {modoCustom ? `${candidatoCustom.cargo} · ${candidatoCustom.partido} · ${candidatoCustom.municipio}/AP` : `${cand?.cargo || ''} · ${cand?.partido || ''} · MACAPA/AP · ${cand?.ano || ''}`}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Meta 2026:</span>
            <input type="number" value={metaInput} onChange={e => setMetaInput(e.target.value)}
              onBlur={() => { const v = parseInt(metaInput); if (v > 0) setMeta(v); }}
              style={{ width: 100, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 15, fontWeight: 700, textAlign: 'center' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>votos</span>
          </div>
        </div>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ ...card() }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>BASE 2022 (TSE✓)</p>
            <p style={{ color: '#2563eb', fontSize: 28, fontWeight: 900, margin: 0 }}>{(modoCustom && candidatoCustom.votos2022 ? parseInt(candidatoCustom.votos2022) : total2022).toLocaleString('pt-BR')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>votos confirmados</p>
          </div>
          <div style={{ ...card() }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>META 2026</p>
            <p style={{ color: '#10b981', fontSize: 28, fontWeight: 900, margin: 0 }}>{meta.toLocaleString('pt-BR')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>votos necessarios</p>
          </div>
          <div style={{ ...card() }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>CRESCIMENTO NECESSARIO</p>
            <p style={{ color: '#f59e0b', fontSize: 28, fontWeight: 900, margin: 0 }}>+{crescimento.toLocaleString('pt-BR')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>+{pctCrescimento}% vs 2022</p>
          </div>
          <div style={{ ...card(classif.label === 'FAVORITO' ? '#f0fdf4' : classif.label === 'COMPETITIVO' ? '#fffbeb' : '#fef2f2', classif.label === 'FAVORITO' ? '#bbf7d0' : classif.label === 'COMPETITIVO' ? '#fde68a' : '#fecaca') }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>CLASSIFICACAO</p>
            <p style={{ color: classif.cor, fontSize: 20, fontWeight: 900, margin: 0 }}>{classif.label}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>{sv.total}/100 pontos</p>
          </div>
        </div>

        {/* Score de Viabilidade */}
        <div style={{ ...card(), marginBottom: 24 }}>
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>Score de Viabilidade Eleitoral</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Base territorial', pts: sv.base, max: 25, desc: `${total2022} votos = ${((total2022/17230)*100).toFixed(1)}% da meta segura` },
              { label: 'Crescimento historico', pts: sv.crescPts, max: 20, desc: '+29% de 2018 para 2022' },
              { label: 'Forca do partido', pts: sv.partido, max: 25, desc: 'MDB elegeu 2 deputados em 2022' },
              { label: 'Potencial de expansao', pts: sv.expansao, max: 20, desc: '3 secoes mobilizaveis, +2.2k potencial' },
              { label: 'Presenca digital', pts: sv.digital, max: 10, desc: 'Presenca publica a estruturar' },
            ].map(i => (
              <div key={i.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 6px' }}>{i.label}</p>
                <p style={{ color: 'var(--text)', fontWeight: 900, fontSize: 18, margin: '0 0 2px' }}>{i.pts}<span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 400 }}>/{i.max}</span></p>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: 0 }}>{i.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 99, height: 8 }}>
            <div style={{ height: '100%', width: `${sv.total}%`, background: classif.cor, borderRadius: 99 }} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '8px 0 0' }}>
            Classificacao: <strong style={{ color: classif.cor }}>{classif.label} ({sv.total}–{sv.total < 55 ? '54' : sv.total < 70 ? '69' : '100'} pontos)</strong> — {
              classif.label === 'DESAFIADOR' ? 'Base real e partido ascendente, mas exige execucao estrategica rigorosa nos proximos 4 meses.' :
              classif.label === 'COMPETITIVO' ? 'Candidato com base solida. Ampliar presenca nos municipios do interior e intensificar mobilizacao em Macapa.' :
              'Candidato em posicao favoravel. Consolidar base e manter ritmo de crescimento.'
            }
          </p>
        </div>

        {/* Distribuicao por municipio */}
        <div style={{ ...card(), marginBottom: 24 }}>
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Distribuicao da Meta por Municipio</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 20px' }}>Base 2022 (TSE✓) vs meta necessaria para {meta.toLocaleString('pt-BR')} votos em 2026</p>
          {municipiosComMeta.slice(0, 12).map((m, i) => {
            const pctAtingido = Math.min(100, Math.round((m.votos2022 / m.metaMun) * 100));
            return (
              <div key={m.municipio} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, width: 20 }}>{i + 1}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, flex: 1 }}>
                    {m.municipio.charAt(0) + m.municipio.slice(1).toLowerCase()}
                  </span>
                  <span style={{ background: m.cor + '20', color: m.cor, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{m.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.votos2022} → <strong style={{ color: 'var(--text)' }}>{m.metaMun}</strong></span>
                  {m.falta > 0 && <span style={{ color: '#ef4444', fontSize: 11 }}>faltam +{m.falta}</span>}
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 99, height: 6, marginLeft: 32 }}>
                  <div style={{ height: '100%', width: `${pctAtingido}%`, background: m.cor, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mapa de Forca */}
        <div style={{ ...card() }}>
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>Mapa de Forca Eleitoral por Regiao</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {[
              { regiao: 'Macapa (Z2+Z10)', votos: 3474, lider: 'INACIO MONTEIRO (7.0k)', class: 'Forte', cor: '#10b981', rec: 'Consolidar e aprofundar presenca nos bairros' },
              { regiao: 'Santana (Z6)', votos: 581, lider: 'FRANCISCO PAULO (4.9k)', class: 'Media', cor: '#f59e0b', rec: 'Potencial de expansao — unico territorio adversario com presenca relevante' },
              { regiao: 'Laranjal do Jari (Z7)', votos: 59, lider: 'ALLINY SERRAO (6.3k)', class: 'Baixa', cor: '#f97316', rec: 'Baixa prioridade — custo alto, retorno limitado' },
              { regiao: 'Vitoria do Jari (Z7)', votos: 1, lider: 'R. ALCIMAR NEY (2.8k)', class: 'Ausente', cor: '#ef4444', rec: 'Nao investir — dominio absoluto do adversario' },
            ].map(r => (
              <div key={r.regiao} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 16, border: `2px solid ${r.cor}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{r.regiao}</span>
                  <span style={{ background: r.cor + '20', color: r.cor, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{r.class}</span>
                </div>
                <p style={{ color: '#2563eb', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>{r.votos.toLocaleString('pt-BR')} vts</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px' }}>Lider: {r.lider}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{r.rec}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
