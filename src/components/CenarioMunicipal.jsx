import { useState, useMemo } from 'react'
import { VEREADORES_2024, getEleitos, calcularQuocienteEleitoral } from '../vereadores2024.js'
import { CANDIDATOS_TSE } from '../candidatosTSE.js'

const DEPUTADOS = CANDIDATOS_TSE
  .filter(c => c.cargo === 'DEPUTADO ESTADUAL')
  .sort((a, b) => (b.total || 0) - (a.total || 0))

function getVotosMun(candidato, prefix) {
  if (!candidato?.municipios) return 0
  const chave = Object.keys(candidato.municipios).find(k =>
    k.toUpperCase().includes(prefix.toUpperCase())
  )
  return chave ? (candidato.municipios[chave] || 0) : 0
}

const COR = {
  PODE: '#7c3aed', MDB: '#0891b2', PDT: '#dc2626', PT: '#dc2626',
  PSD: '#1d4ed8', PRD: '#d97706', SOLIDARIEDADE: '#059669',
  PSOL: '#7c3aed', REDE: '#16a34a', PP: '#2563eb', REPUBLICANOS: '#ea580c',
  PL: '#1e40af', default: '#6b7280'
}
const cor = p => COR[p] || COR.default

export default function CenarioMunicipal({ onVoltar }) {
  const [idx, setIdx] = useState(0)
  const [mun, setMun] = useState('macapa')
  const [aba, setAba] = useState('aliados')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('TODOS')

  const cand = DEPUTADOS[idx]
  const dados = mun === 'macapa' ? VEREADORES_2024.macapa : VEREADORES_2024.santana
  const eleitos = useMemo(() => getEleitos(mun), [mun])
  const qe = calcularQuocienteEleitoral(mun)
  const votosCand = mun === 'macapa' ? getVotosMun(cand, 'MACAP') : getVotosMun(cand, 'SANTANA')
  const maiorVotado = eleitos[0]

  const distPartidos = useMemo(() => {
    const m = {}
    eleitos.forEach(v => { m[v.partido] = (m[v.partido] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [eleitos])

  const partidos = useMemo(() => {
    const ps = [...new Set(dados.candidatos.map(c => c.partido))].sort()
    return ['TODOS', ...ps]
  }, [dados])

  const candidatosFiltrados = useMemo(() => {
    let lista = dados.candidatos
    if (filtro !== 'TODOS') lista = lista.filter(c => c.partido === filtro)
    if (busca) lista = lista.filter(c =>
      c.nomeUrna.toLowerCase().includes(busca.toLowerCase()) ||
      c.partido.toLowerCase().includes(busca.toLowerCase())
    )
    return lista
  }, [dados, filtro, busca, mun])

  const s = { padding: '1rem', maxWidth: 820, margin: '0 auto', fontFamily: 'sans-serif' }

  return (
    <div style={s}>
      <button onClick={onVoltar} style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
        &larr; Voltar
      </button>

      <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginBottom: 4 }}>
          Cenario Municipal 2024
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Camara de Vereadores - analise de aliancas para 2026
        </p>
      </div>

      <div style={{ background: '#eff6ff', border: '2px solid #1d4ed8', borderRadius: 12, padding: '1rem', marginBottom: '1.2rem' }}>
        <label style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
          Selecione o candidato para analise
        </label>
        <select
          value={idx}
          onChange={e => { setIdx(Number(e.target.value)); setFiltro('TODOS'); setBusca('') }}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: '0.9rem', fontWeight: 600, color: '#1e3a8a', background: 'white', cursor: 'pointer' }}
        >
          {DEPUTADOS.map((d, i) => (
            <option key={i} value={i}>
              {d.nome} ({(d.total || 0).toLocaleString('pt-BR')} votos AP 2022)
            </option>
          ))}
        </select>
        {cand && (
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}>
              Total AP 2022: {(cand.total || 0).toLocaleString('pt-BR')}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}>
              Macapa: {getVotosMun(cand, 'MACAP').toLocaleString('pt-BR')}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}>
              Santana: {getVotosMun(cand, 'SANTANA').toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1rem' }}>
        {['macapa', 'santana'].map(m => (
          <button key={m} onClick={() => { setMun(m); setFiltro('TODOS'); setBusca('') }}
            style={{ padding: '8px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600, background: mun === m ? '#1e3a8a' : '#e2e8f0', color: mun === m ? '#fff' : '#475569', fontSize: '0.9rem' }}>
            {m === 'macapa' ? 'Macapa' : 'Santana'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1rem' }}>
        {[
          { label: 'Cadeiras total', valor: eleitos.length, cor: '#1e3a8a' },
          { label: 'Quociente eleitoral', valor: qe.toLocaleString('pt-BR'), cor: '#0891b2' },
          { label: 'Votos candidato', valor: votosCand.toLocaleString('pt-BR'), cor: '#059669' },
          { label: 'Votos validos', valor: dados.totalVotosValidos.toLocaleString('pt-BR'), cor: '#374151' },
        ].map((c, i) => (
          <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
        {[
          { id: 'aliados', label: 'Distribuicao' },
          { id: 'ranking', label: 'Ranking Geral' },
          { id: 'cruzamento', label: 'Cruzamento 2022' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: 'transparent', color: aba === a.id ? '#1e3a8a' : '#94a3b8', borderBottom: aba === a.id ? '3px solid #1e3a8a' : '3px solid transparent', marginBottom: -2 }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'aliados' && (
        <div>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.9rem' }}>
              Distribuicao de cadeiras por partido
            </h3>
            {distPartidos.map(([partido, qtd]) => (
              <div key={partido} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{partido}</span>
                  <span style={{ color: '#6b7280' }}>{qtd} cadeira{qtd > 1 ? 's' : ''}</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7 }}>
                  <div style={{ width: `${(qtd / eleitos.length) * 100}%`, height: 7, borderRadius: 4, background: cor(partido) }} />
                </div>
              </div>
            ))}
          </div>
          <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: '0.9rem' }}>
            Vereadores eleitos em {dados.municipio}
          </h3>
          {eleitos.map((v, i) => (
            <div key={v.sq} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>#{i+1} {v.nomeUrna}</div>
                <span style={{ background: cor(v.partido) + '22', color: cor(v.partido), padding: '1px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem' }}>{v.partido}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.95rem' }}>
                {v.votos.toLocaleString('pt-BR')}
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 3 }}>vts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 'ranking' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar candidato ou partido..."
              style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
            <select value={filtro} onChange={e => setFiltro(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
              {partidos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8 }}>
            {candidatosFiltrados.length} de {dados.totalCandidatos} candidatos
          </div>
          {candidatosFiltrados.map((v, i) => (
            <div key={v.sq} style={{ background: v.eleito ? '#f0fdf4' : '#f8fafc', border: v.eleito ? '1px solid #bbf7d0' : '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', minWidth: 26 }}>#{i+1}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.86rem' }}>{v.nomeUrna}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                    <span style={{ background: cor(v.partido) + '22', color: cor(v.partido), padding: '1px 5px', borderRadius: 3, fontWeight: 700, fontSize: '0.7rem' }}>{v.partido}</span>
                    <span style={{ fontSize: '0.7rem', color: v.eleito ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>{v.eleito ? 'Eleito' : 'Nao eleito'}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: v.eleito ? '#16a34a' : '#374151', fontSize: '0.95rem', textAlign: 'right' }}>
                {v.votos.toLocaleString('pt-BR')}
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400 }}>votos</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 'cruzamento' && (
        <div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: 8, fontSize: '0.9rem' }}>
              {cand?.nome || ''} (Dep. Estadual 2022) x Camara Municipal 2024
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1d4ed8' }}>
                  {votosCand > 0 ? votosCand.toLocaleString('pt-BR') : '-'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Votos 2022 em {dados.municipio}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                  {maiorVotado?.votos.toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Maior votado vereador 2024</div>
              </div>
            </div>
          </div>
          <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.88rem' }}>
            Forca relativa vs vereadores eleitos
          </h3>
          {eleitos.map(v => {
            const pct = votosCand > 0 ? Math.round((v.votos / votosCand) * 100) : 0
            return (
              <div key={v.sq} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>
                    {v.nomeUrna}
                    <span style={{ marginLeft: 6, fontSize: '0.68rem', background: cor(v.partido) + '22', color: cor(v.partido), padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{v.partido}</span>
                  </span>
                  <span style={{ color: '#6b7280' }}>{v.votos.toLocaleString('pt-BR')} vts</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: 6, borderRadius: 4, background: '#1d4ed8' }} />
                </div>
                {votosCand > 0 && (
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{pct}% dos votos do candidato</div>
                )}
              </div>
            )
          })}
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '0.8rem', fontSize: '0.8rem', color: '#78350f', marginTop: 12 }}>
            <strong>Nota metodologica:</strong> O cruzamento compara votos do deputado estadual (2022) com votos de vereador (2024) no mesmo municipio. Eleicoes diferentes - use como indicador de forca territorial, nao como correlacao direta.
          </div>
        </div>
      )}
    </div>
  )
}
