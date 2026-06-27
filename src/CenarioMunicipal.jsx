import { useState, useMemo } from 'react'
import { VEREADORES_2024, getEleitos, getTopVotados, calcularQuocienteEleitoral } from './vereadores2024.js'
import { useCandidatoAnalise } from './lib/useCandidatoAnalise'

// Votos do candidato configurado por município (tabela analise_candidato).
// municipios: objeto { "MACAPÁ": N, "SANTANA": N, ... }
function getVotosMunicipio(candidato, nomeMunicipio) {
  if (!candidato?.municipios) return 0
  const chave = Object.keys(candidato.municipios).find(k =>
    k.toUpperCase().includes(nomeMunicipio.toUpperCase().substring(0, 5))
  )
  return chave ? (candidato.municipios[chave] || 0) : 0
}

const COR_PARTIDO = {
  'UNIÃO': '#1d4ed8', 'PODE': '#7c3aed', 'MDB': '#0891b2', 'PDT': '#dc2626',
  'PT': '#dc2626', 'PSD': '#1d4ed8', 'PRD': '#d97706', 'SOLIDARIEDADE': '#059669',
  'PSOL': '#7c3aed', 'REDE': '#16a34a', 'PP': '#2563eb', 'REPUBLICANOS': '#ea580c',
  'PL': '#1e40af', 'default': '#6b7280'
}

function corPartido(p) {
  return COR_PARTIDO[p] || COR_PARTIDO.default
}

function badgeSituacao(eleito) {
  return eleito
    ? 'bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold'
    : 'bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full'
}

// Cruzamento de zonas TSE 2022 (deputado estadual) com vereador 2024
// Usamos municípios como proxy — zona-a-zona requer arquivo de seção
function cruzarAliados(municipio, partido) {
  const eleitos = getEleitos(municipio)
  // Aliados = vereadores do mesmo partido do candidato configurado
  const aliados = partido ? eleitos.filter(v => (v.partido || '').toUpperCase() === partido) : []
  const outros = partido ? eleitos.filter(v => (v.partido || '').toUpperCase() !== partido) : eleitos
  return { aliados, outros }
}

export default function CenarioMunicipal({ config, onVoltar }) {
  const [municipio, setMunicipio] = useState('macapa')
  const [aba, setAba] = useState('aliados') // aliados | ranking | cruzamento
  const [busca, setBusca] = useState('')
  const [filtroPartido, setFiltroPartido] = useState('TODOS')

  const { candidato: cand } = useCandidatoAnalise()
  const partidoCand = (config?.partido || '').toUpperCase().trim()
  const nomeCand = config?.nome || cand?.nome || 'o candidato'

  const dados = municipio === 'macapa' ? VEREADORES_2024.macapa : VEREADORES_2024.santana
  const eleitos = useMemo(() => getEleitos(municipio), [municipio])
  const { aliados, outros } = useMemo(() => cruzarAliados(municipio, partidoCand), [municipio, partidoCand])
  const qe = calcularQuocienteEleitoral(municipio)

  // Votos do candidato configurado neste município (analise_candidato)
  const votosCand = getVotosMunicipio(cand, municipio === 'macapa' ? 'MACAP' : 'SANTANA')

  // Lista filtrada para ranking
  const candidatosFiltrados = useMemo(() => {
    let lista = dados.candidatos
    if (filtroPartido !== 'TODOS') lista = lista.filter(c => c.partido === filtroPartido)
    if (busca) lista = lista.filter(c =>
      c.nomeUrna.toLowerCase().includes(busca.toLowerCase()) ||
      c.partido.toLowerCase().includes(busca.toLowerCase())
    )
    return lista
  }, [dados, filtroPartido, busca, municipio])

  const partidos = useMemo(() => {
    const ps = [...new Set(dados.candidatos.map(c => c.partido))].sort()
    return ['TODOS', ...ps]
  }, [dados])

  // Distribuição por partido (eleitos)
  const distPartidos = useMemo(() => {
    const map = {}
    eleitos.forEach(c => { map[c.partido] = (map[c.partido] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [eleitos])

  const totalEleitos = eleitos.length
  const maiorVotado = eleitos[0]

  return (
    <div style={{ padding: '1rem', maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button onClick={onVoltar} style={{ background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>← Voltar</button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8', marginBottom: 4 }}>
          🏛️ Cenário Municipal 2024
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Câmara de Vereadores — análise de alianças para 2026
        </p>
      </div>

      {/* Seletor município */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.2rem' }}>
        {['macapa', 'santana'].map(m => (
          <button key={m} onClick={() => { setMunicipio(m); setFiltroPartido('TODOS'); setBusca('') }}
            style={{
              padding: '8px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600,
              background: municipio === m ? '#1d4ed8' : 'var(--surface-2)',
              color: municipio === m ? '#fff' : 'var(--text-muted)', fontSize: '0.9rem'
            }}>
            {m === 'macapa' ? '📍 Macapá' : '📍 Santana'}
          </button>
        ))}
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: '1.2rem' }}>
        {[
          { label: 'Total de cadeiras', valor: totalEleitos, cor: '#1e3a8a' },
          { label: 'Cadeiras ' + (partidoCand || '—'), valor: aliados.length, cor: '#1d4ed8', destaque: true },
          { label: 'Quociente eleitoral', valor: qe.toLocaleString('pt-BR'), cor: '#0891b2' },
          { label: 'Votos válidos', valor: dados.totalVotosValidos.toLocaleString('pt-BR'), cor: '#059669' },
        ].map((c, i) => (
          <div key={i} style={{
            background: c.destaque ? '#eff6ff' : 'var(--surface-2)',
            border: c.destaque ? '2px solid #1d4ed8' : '1px solid var(--border)',
            borderRadius: 12, padding: '14px 12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
        {[
          { id: 'aliados', label: '🤝 Aliados ' + (partidoCand || '—') },
          { id: 'ranking', label: '🏆 Ranking Geral' },
          { id: 'cruzamento', label: '🔀 Cruzamento 2022' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.82rem', background: 'transparent',
              color: aba === a.id ? '#1d4ed8' : 'var(--text-muted)',
              borderBottom: aba === a.id ? '3px solid #1d4ed8' : '3px solid transparent',
              marginBottom: -2
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* === ABA ALIADOS === */}
      {aba === 'aliados' && (
        <div>
          {/* Distribuição por partido */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 10, fontSize: '0.95rem' }}>
              Distribuição de cadeiras por partido
            </h3>
            {distPartidos.map(([partido, qtd]) => (
              <div key={partido} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                  <span style={{
                    fontWeight: partido === partidoCand ? 800 : 600,
                    color: partido === partidoCand ? '#1d4ed8' : 'var(--text)'
                  }}>
                    {partido === partidoCand ? '⭐ ' : ''}{partido}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{qtd} cadeira{qtd > 1 ? 's' : ''}</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 8 }}>
                  <div style={{
                    width: `${(qtd / totalEleitos) * 100}%`,
                    height: 8, borderRadius: 4,
                    background: corPartido(partido)
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Vereadores aliados */}
          <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontSize: '0.95rem' }}>
            🤝 Vereadores {partidoCand || '—'} eleitos — potenciais aliados 2026
          </h3>
          {aliados.length === 0 ? (
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: '1rem', color: '#854d0e', fontSize: '0.9rem' }}>
              {partidoCand
                ? `⚠️ Nenhum vereador do ${partidoCand} eleito em ${dados.municipio}. Considere aliados de federação.`
                : '⚠️ Defina o partido do candidato no ⚙️ Config (campo "Partido") para ver os vereadores aliados.'}
            </div>
          ) : (
            aliados.map((v, i) => (
              <div key={v.sq} style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.95rem' }}>
                    #{i + 1} {v.nomeUrna}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Nº {v.numero} · {v.partido}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1.1rem' }}>
                    {v.votos.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>votos</div>
                </div>
              </div>
            ))
          )}

          {/* Outros partidos eleitos */}
          <h3 style={{ fontWeight: 700, color: 'var(--text)', margin: '1.2rem 0 8px', fontSize: '0.95rem' }}>
            🔎 Demais vereadores eleitos — análise de alinhamento
          </h3>
          {outros.map((v, i) => (
            <div key={v.sq} style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{v.nomeUrna}</div>
                <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
                  <span style={{
                    background: corPartido(v.partido) + '22',
                    color: corPartido(v.partido),
                    padding: '1px 8px', borderRadius: 4, fontWeight: 700
                  }}>{v.partido}</span>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>
                {v.votos.toLocaleString('pt-BR')}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>vts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === ABA RANKING === */}
      {aba === 'ranking' && (
        <div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar candidato ou partido..."
              style={{
                flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text)'
              }}
            />
            <select value={filtroPartido} onChange={e => setFiltroPartido(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text)' }}>
              {partidos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Exibindo {candidatosFiltrados.length} de {dados.totalCandidatos} candidatos
          </div>

          {candidatosFiltrados.map((v, i) => (
            <div key={v.sq} style={{
              background: v.eleito ? '#f0fdf4' : 'var(--surface-2)',
              border: v.eleito ? '1px solid #bbf7d0' : '1px solid var(--border)',
              borderLeft: v.partido === partidoCand ? '4px solid #1d4ed8' : undefined,
              borderRadius: 8, padding: '10px 12px', marginBottom: 5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 28 }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>{v.nomeUrna}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                    <span style={{
                      background: corPartido(v.partido) + '22',
                      color: corPartido(v.partido),
                      padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem'
                    }}>{v.partido}</span>
                    <span className={badgeSituacao(v.eleito)}>
                      {v.eleito ? '✓ Eleito' : 'Não eleito'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: v.eleito ? '#16a34a' : 'var(--text)', fontSize: '1rem', textAlign: 'right' }}>
                {v.votos.toLocaleString('pt-BR')}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>votos</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === ABA CRUZAMENTO === */}
      {aba === 'cruzamento' && (
        <div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: 6, fontSize: '0.95rem' }}>
              📊 {nomeCand} (Dep. Estadual 2022) × Câmara Municipal 2024
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1d4ed8' }}>
                  {votosCand > 0 ? votosCand.toLocaleString('pt-BR') : '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Votos {nomeCand} 2022{'\n'}em {dados.municipio}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                  {maiorVotado?.votos.toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Maior votado vereador 2024
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 10, fontSize: '0.9rem' }}>
              🎯 Estratégia de alinhamento por votação
            </h3>
            {eleitos.map(v => {
              const pct = votosCand > 0 ? Math.round((v.votos / votosCand) * 100) : 0
              const aliado = v.partido === partidoCand
              return (
                <div key={v.sq} style={{
                  marginBottom: 10,
                  opacity: aliado ? 1 : 0.8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                    <span style={{ fontWeight: aliado ? 800 : 600, color: aliado ? '#1d4ed8' : 'var(--text)' }}>
                      {aliado ? '⭐ ' : ''}{v.nomeUrna}
                      <span style={{
                        marginLeft: 6, fontSize: '0.7rem',
                        background: corPartido(v.partido) + '22',
                        color: corPartido(v.partido),
                        padding: '1px 5px', borderRadius: 3, fontWeight: 700
                      }}>{v.partido}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{v.votos.toLocaleString('pt-BR')} vts</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 4, height: 7 }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`, height: 7, borderRadius: 4,
                      background: aliado ? '#1d4ed8' : corPartido(v.partido)
                    }} />
                  </div>
                  {votosCand > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {pct}% dos votos de {nomeCand} em {dados.municipio}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '0.8rem', fontSize: '0.82rem', color: '#78350f' }}>
            <strong>⚠️ Nota metodológica:</strong> O cruzamento compara votos do deputado estadual (2022) com votos de vereador (2024) no mesmo município.
            Eleições diferentes — use como indicador de força territorial, não como correlação direta.
          </div>
        </div>
      )}

    </div>
  )
}
