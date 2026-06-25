// Sinalizador de status do apoiador (classificação de contato).
// Reutiliza a coluna eleitores.status_voto. null = "Não informado" (padrão).
export const STATUS_VOTO = [
  { v: '',           label: 'Não informado', emoji: '⚪', bg: '#4b5563', fg: '#f9fafb' },
  { v: 'conquistar', label: 'Conquistar',    emoji: '🟡', bg: '#facc15', fg: '#422006' },
  { v: 'positivo',   label: 'Positivo',      emoji: '🟢', bg: '#22c55e', fg: '#052e16' },
  { v: 'negativo',   label: 'Negativo',      emoji: '🔴', bg: '#ef4444', fg: '#450a0a' },
];

export function corStatusVoto(value) {
  return STATUS_VOTO.find(o => (o.v || null) === (value || null)) || STATUS_VOTO[0];
}

export default function StatusVotoSelect({ value, onChange }) {
  const cur = corStatusVoto(value);
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      title="Classificação do contato"
      style={{ background: cur.bg, color: cur.fg, border: 'none', borderRadius: 6, padding: '4px 6px', fontSize: 11, fontWeight: 700, cursor: 'pointer', maxWidth: 130 }}
    >
      {STATUS_VOTO.map(o => (
        <option key={o.v} value={o.v} style={{ background: '#fff', color: '#111827' }}>{o.emoji} {o.label}</option>
      ))}
    </select>
  );
}

// Barra de filtro por classificação (Todos + as 4 cores, com contagem)
export function FiltroStatusVoto({ value, onChange, eleitores = [] }) {
  const cont = (v) => eleitores.filter(e => (e.status_voto || '') === v).length;
  const itens = [{ v: '__todos', label: 'Todos', emoji: '📋', bg: '#1f2937', fg: '#e5e7eb', n: eleitores.length }]
    .concat(STATUS_VOTO.map(o => ({ ...o, n: cont(o.v) })));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      {itens.map(o => {
        const ativo = (o.v === '__todos' && !value) || o.v === value;
        return (
          <button key={o.v} onClick={() => onChange(o.v === '__todos' ? '' : o.v)}
            style={{ background: ativo ? o.bg : '#0a0f1c', color: ativo ? o.fg : '#94a3b8', border: `1px solid ${ativo ? o.bg : '#1f2937'}`, borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {o.emoji} {o.label} ({o.n})
          </button>
        );
      })}
    </div>
  );
}
