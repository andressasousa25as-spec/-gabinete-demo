import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function PendingBadge() {
  const { online, pendentes } = useOnlineStatus();
  if (online && pendentes === 0) return null;
  return (
    <span style={{ background: online ? '#CBA15C' : '#64748b', color: '#0E2236', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
      {online ? `↑ ${pendentes} aguardando envio` : '⚠ sem conexão'}
    </span>
  );
}
