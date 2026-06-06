import { useState } from 'react';
import { gerarRef, gerarLinkEleitor, gerarLinkWhatsApp, registrarClique } from '../lib/rastreamento';
export default function LinkRastreavel({ eleitor, candidato }) {
  const [copiado, setCopiado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const ref = gerarRef(eleitor.nome, eleitor.telefone || '');
  const copiarLink = async () => {
    await navigator.clipboard.writeText(gerarLinkEleitor(ref));
    await registrarClique({ ref, nomeEleitor: eleitor.nome, telefone: eleitor.telefone, utmSource: 'link_copiado' });
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };
  const abrirWhatsApp = async () => {
    await registrarClique({ ref, nomeEleitor: eleitor.nome, telefone: eleitor.telefone, utmSource: 'whatsapp' });
    window.open(gerarLinkWhatsApp(eleitor.telefone, eleitor.nome, candidato || 'Candidato'), '_blank');
    setEnviado(true); setTimeout(() => setEnviado(false), 2000);
  };
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      <button onClick={copiarLink} style={{ background: copiado ? '#16a34a' : '#1e40af', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{copiado ? 'Copiado!' : 'Copiar link'}</button>
      <button onClick={abrirWhatsApp} style={{ background: enviado ? '#15803d' : '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{enviado ? 'Enviado!' : 'WhatsApp rastreado'}</button>
    </div>
  );
}