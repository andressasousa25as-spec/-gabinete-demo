export default function TelaBloqueio({ onLogout }) {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:420, textAlign:'center', boxShadow:'0 25px 50px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Assinatura vencida</h1>
        <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Seu acesso ao Gabinete Digital está suspenso. Entre em contato para reativar. Seus dados estão guardados e seguros.</p>
        <button onClick={onLogout} style={{ width:'100%', padding:13, borderRadius:10, background:'#1e40af', color:'white', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  );
}
