// Política de Privacidade (LGPD) — página pública, rota #/privacidade
export default function PoliticaPrivacidade() {
  const wpp = '5596981248122';
  const email = 'gabinetedigitaldigitalsf@gmail.com';
  const H = ({ children }) => (
    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '22px 0 8px' }}>{children}</h2>
  );
  const P = ({ children }) => (
    <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', margin: '0 0 10px' }}>{children}</p>
  );
  return (
    <div style={{ minHeight: '100vh', background: '#eff6ff', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 'clamp(20px, 5vw, 40px)', boxShadow: '0 10px 30px rgba(0,0,0,.08)' }}>
        <p style={{ fontSize: 13, color: '#2563eb', fontWeight: 700, margin: 0 }}>GABINETE DIGITAL SF</p>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: '#0f172a', margin: '4px 0 4px' }}>Política de Privacidade</h1>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Última atualização: junho/2026 · Versão 1.0</p>

        <P>Esta Política explica como tratamos os dados pessoais coletados neste cadastro, em
          conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</strong>
          e com as normas aplicáveis do TSE.</P>

        <H>1. Controlador dos dados</H>
        <P>O responsável pelo tratamento dos dados (controlador) é o <strong>GABINETE DIGITAL SF</strong>,
          que opera este cadastro. Os dados são fornecidos <strong>voluntariamente pelo titular</strong> e
          <strong> não são obtidos a partir do cadastro eleitoral da Justiça Eleitoral</strong>.</P>

        <H>2. Encarregado / canal de contato</H>
        <P>Para exercer seus direitos, tirar dúvidas ou solicitar a exclusão dos seus dados, fale com o
          encarregado pelo tratamento:</P>
        <P>📧 E-mail: <a href={`mailto:${email}`} style={{ color: '#2563eb', fontWeight: 600 }}>{email}</a><br />
          📱 WhatsApp: <a href={`https://wa.me/${wpp}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>(96) 98124-8122</a></P>

        <H>3. Quais dados coletamos</H>
        <P>Nome, telefone, e-mail (quando informado), endereço/bairro, município, zona e seção eleitoral,
          data de nascimento (quando informada) e a liderança que indicou o cadastro. Coletamos apenas o
          necessário para as finalidades abaixo (princípio da minimização).</P>

        <H>4. Para que usamos (finalidades)</H>
        <P>I. Comunicação e relacionamento com apoiadores;<br />
          II. Envio de informações sobre ações, projetos e iniciativas de interesse público;<br />
          III. Mobilização de apoiadores e convites para eventos;<br />
          IV. Ações de participação cidadã.</P>
        <P>Os dados <strong>não serão usados para finalidade diversa</strong> da consentida nem
          <strong> compartilhados com terceiros</strong> sem novo consentimento.</P>

        <H>5. Base legal</H>
        <P>O tratamento se baseia no <strong>consentimento do titular</strong> (art. 7º, I e art. 11, I da LGPD),
          coletado de forma livre, informada e inequívoca no momento do cadastro.</P>

        <H>6. Por quanto tempo guardamos</H>
        <P>Os dados são mantidos <strong>enquanto durar a finalidade ou até a revogação do consentimento</strong>.
          Salvo obrigação legal de retenção, serão <strong>eliminados em até 12 meses após o encerramento do
          processo eleitoral</strong>.</P>

        <H>7. Seus direitos (art. 18 da LGPD)</H>
        <P>Você pode, a qualquer momento: confirmar a existência do tratamento; acessar, corrigir ou atualizar
          seus dados; solicitar a <strong>eliminação</strong>; revogar o consentimento; e obter informação sobre
          com quem os dados são compartilhados. Para qualquer pedido, use os canais do item 2.</P>

        <H>8. Como revogar o consentimento</H>
        <P>Você pode revogar a qualquer momento respondendo <strong>SAIR</strong> a qualquer mensagem que
          receber, ou solicitando pelos canais de contato acima. A revogação interrompe o envio de
          comunicações e, mediante pedido, leva à exclusão dos dados.</P>

        <H>9. Segurança</H>
        <P>Adotamos medidas de segurança proporcionais: acesso restrito por autenticação e perfis, e os dados
          ficam protegidos por controle de permissão. Em caso de incidente com risco relevante, adotaremos as
          providências da LGPD.</P>

        <p style={{ fontSize: 12, color: '#64748b', marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          Este documento poderá ser atualizado. A versão vigente estará sempre disponível nesta página.
        </p>
        <div style={{ marginTop: 16 }}>
          <a href="#/" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>← Voltar</a>
        </div>
      </div>
    </div>
  );
}
