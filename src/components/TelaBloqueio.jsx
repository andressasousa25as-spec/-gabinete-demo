export default function TelaBloqueio({ onLogout }) {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,var(--bg),#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--surface)', borderRadius:20, padding:40, maxWidth:420, textAlign:'center', boxShadow:'0 25px 50px var(--overlay)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Assinatura vencida</h1>
        <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:24 }}>O acesso ao Gabinete Digital está suspenso. Entre em contato para reativar. Os dados estão guardados e seguros.</p>
        <button onClick={onLogout} style={{ width:'100%', padding:13, borderRadius:10, background:'#1e40af', color:'white', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  );
}
