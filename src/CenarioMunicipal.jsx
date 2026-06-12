import { useState, useMemo } from 'react'
import { VEREADORES_2024, getEleitos, getTopVotados, calcularQuocienteEleitoral } from './vereadores2024.js'
import { CANDIDATOS_TSE } from './candidatosTSE.js'

// Paulinho Ramos - União Brasil - dados TSE 2022
// candidatosTSE.js estrutura: { nome, cargo, total, municipios: { "MACAPÃ": N, ... }, zonas, secoes }
// Busca por deputado estadual do União Brasil com maior votação em Macapá
const PAULINHO = CANDIDATOS_TSE.find(c =>
  c.nome === 'PAULO ALCEU AVILA RAMOS'
) || null

// municipios: chaves com encoding latin1 quebrado ex: "MACAPÃ" = "MACAPÁ"
// Normaliza buscando por substring
function getVotosMunicipio(candidato, nomeMunicipio) {
  if (!candidato?.municipios) return 0
  const chave = Object.keys(candidato.municipios).find(k =>
    k.toUpperCase().includes(nomeMunicipio.toUpperCase().substring(0, 5))
  )
  return chave ? (candidato.municipios[chave] || 0) : 0
}

const PARTIDO_PAULINHO = 'UNIÃO'

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
function cruzarAliados(municipio) {
  const mKey = municipio === 'macapa' ? 'MACAPÁ' : 'SANTANA'
  const eleitos = getEleitos(municipio)
  // Aliados = mesmo partido OU partidos que compõem a base do candidato
  const aliados = eleitos.filter(v => v.partido === PARTIDO_PAULINHO)
  const outros = eleitos.filter(v => v.partido !== PARTIDO_PAULINHO)
  return { aliados, outros }
}

export default function CenarioMunicipal({ config, onVoltar }) {
  const [municipio, setMunicipio] = useState('macapa')
  const [aba, setAba] = useState('aliados') // aliados | ranking | cruzamento
  const [busca, setBusca] = useState('')
  const [filtroPartido, setFiltroPartido] = useState('TODOS')

  const dados = municipio === 'macapa' ? VEREADORES_2024.macapa : VEREADORES_2024.santana
  const eleitos = useMemo(() => getEleitos(municipio), [municipio])
  const { aliados, outros } = useMemo(() => cruzarAliados(municipio), [municipio])
  const qe = calcularQuocienteEleitoral(municipio)

  // Votos do Paulinho neste município (TSE 2022)
  const votosPaulinho = municipio === 'macapa'
    ? getVotosMunicipio(PAULINHO, 'MACAP')
    : getVotosMunicipio(PAULINHO, 'SANTANA')

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
      <button onClick={onVoltar} style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>← Voltar</button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', marginBottom: 4 }}>
          🏛️ Cenário Municipal 2024
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Câmara de Vereadores — análise de alianças para 2026
        </p>
      </div>

      {/* Seletor município */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.2rem' }}>
        {['macapa', 'santana'].map(m => (
          <button key={m} onClick={() => { setMunicipio(m); setFiltroPartido('TODOS'); setBusca('') }}
            style={{
              padding: '8px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600,
              background: municipio === m ? '#1e3a8a' : '#e2e8f0',
              color: municipio === m ? '#fff' : '#475569', fontSize: '0.9rem'
            }}>
            {m === 'macapa' ? '📍 Macapá' : '📍 Santana'}
          </button>
        ))}
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: '1.2rem' }}>
        {[
          { label: 'Total de cadeiras', valor: totalEleitos, cor: '#1e3a8a' },
          { label: 'Cadeiras ' + PARTIDO_PAULINHO, valor: aliados.length, cor: '#1d4ed8', destaque: true },
          { label: 'Quociente eleitoral', valor: qe.toLocaleString('pt-BR'), cor: '#0891b2' },
          { label: 'Votos válidos', valor: dados.totalVotosValidos.toLocaleString('pt-BR'), cor: '#059669' },
        ].map((c, i) => (
          <div key={i} style={{
            background: c.destaque ? '#eff6ff' : '#f8fafc',
            border: c.destaque ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
            borderRadius: 12, padding: '14px 12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
        {[
          { id: 'aliados', label: '🤝 Aliados ' + PARTIDO_PAULINHO },
          { id: 'ranking', label: '🏆 Ranking Geral' },
          { id: 'cruzamento', label: '🔀 Cruzamento 2022' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.82rem', background: 'transparent',
              color: aba === a.id ? '#1e3a8a' : '#94a3b8',
              borderBottom: aba === a.id ? '3px solid #1e3a8a' : '3px solid transparent',
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
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.95rem' }}>
              Distribuição de cadeiras por partido
            </h3>
            {distPartidos.map(([partido, qtd]) => (
              <div key={partido} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                  <span style={{
                    fontWeight: partido === PARTIDO_PAULINHO ? 800 : 600,
                    color: partido === PARTIDO_PAULINHO ? '#1d4ed8' : '#374151'
                  }}>
                    {partido === PARTIDO_PAULINHO ? '⭐ ' : ''}{partido}
                  </span>
                  <span style={{ color: '#6b7280' }}>{qtd} cadeira{qtd > 1 ? 's' : ''}</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8 }}>
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
          <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: '0.95rem' }}>
            🤝 Vereadores {PARTIDO_PAULINHO} eleitos — potenciais aliados 2026
          </h3>
          {aliados.length === 0 ? (
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: '1rem', color: '#854d0e', fontSize: '0.9rem' }}>
              ⚠️ Nenhum vereador do {PARTIDO_PAULINHO} eleito em {dados.municipio}. Considere aliados de federação.
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
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    Nº {v.numero} · {v.partido}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1.1rem' }}>
                    {v.votos.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>votos</div>
                </div>
              </div>
            ))
          )}

          {/* Outros partidos eleitos */}
          <h3 style={{ fontWeight: 700, color: '#1e293b', margin: '1.2rem 0 8px', fontSize: '0.95rem' }}>
            🔎 Demais vereadores eleitos — análise de alinhamento
          </h3>
          {outros.map((v, i) => (
            <div key={v.sq} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '10px 14px', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{v.nomeUrna}</div>
                <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
                  <span style={{
                    background: corPartido(v.partido) + '22',
                    color: corPartido(v.partido),
                    padding: '1px 8px', borderRadius: 4, fontWeight: 700
                  }}>{v.partido}</span>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: '1rem' }}>
                {v.votos.toLocaleString('pt-BR')}
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 4 }}>vts</span>
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
                border: '1px solid #d1d5db', fontSize: '0.85rem'
              }}
            />
            <select value={filtroPartido} onChange={e => setFiltroPartido(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
              {partidos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8 }}>
            Exibindo {candidatosFiltrados.length} de {dados.totalCandidatos} candidatos
          </div>

          {candidatosFiltrados.map((v, i) => (
            <div key={v.sq} style={{
              background: v.eleito ? '#f0fdf4' : '#f8fafc',
              border: v.eleito ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              borderLeft: v.partido === PARTIDO_PAULINHO ? '4px solid #1d4ed8' : undefined,
              borderRadius: 8, padding: '10px 12px', marginBottom: 5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 28 }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>{v.nomeUrna}</div>
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
              <div style={{ fontWeight: 700, color: v.eleito ? '#16a34a' : '#374151', fontSize: '1rem', textAlign: 'right' }}>
                {v.votos.toLocaleString('pt-BR')}
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>votos</div>
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
              📊 Paulinho Ramos (Dep. Estadual 2022) × Câmara Municipal 2024
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1d4ed8' }}>
                  {votosPaulinho > 0 ? votosPaulinho.toLocaleString('pt-BR') : '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Votos Paulinho 2022{'\n'}em {dados.municipio}
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

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.9rem' }}>
              🎯 Estratégia de alinhamento por votação
            </h3>
            {eleitos.map(v => {
              const pct = votosPaulinho > 0 ? Math.round((v.votos / votosPaulinho) * 100) : 0
              const aliado = v.partido === PARTIDO_PAULINHO
              return (
                <div key={v.sq} style={{
                  marginBottom: 10,
                  opacity: aliado ? 1 : 0.8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                    <span style={{ fontWeight: aliado ? 800 : 600, color: aliado ? '#1d4ed8' : '#374151' }}>
                      {aliado ? '⭐ ' : ''}{v.nomeUrna}
                      <span style={{
                        marginLeft: 6, fontSize: '0.7rem',
                        background: corPartido(v.partido) + '22',
                        color: corPartido(v.partido),
                        padding: '1px 5px', borderRadius: 3, fontWeight: 700
                      }}>{v.partido}</span>
                    </span>
                    <span style={{ color: '#6b7280' }}>{v.votos.toLocaleString('pt-BR')} vts</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7 }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`, height: 7, borderRadius: 4,
                      background: aliado ? '#1d4ed8' : corPartido(v.partido)
                    }} />
                  </div>
                  {votosPaulinho > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>
                      {pct}% dos votos do Paulinho em {dados.municipio}
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
