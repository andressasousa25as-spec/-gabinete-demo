export default function TermoLGPD({ aceito, onChange }) {
  return (
    <div style={{
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <p style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold', marginBottom: '8px' }}>
        📋 TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS
      </p>
      <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.7', marginBottom: '12px' }}>
        Ao marcar esta opção, o titular autoriza, de forma livre, informada e inequívoca, o tratamento
        dos seus dados pessoais (nome, telefone, endereço, zona e seção eleitoral) pelo
        responsável por este cadastro, para as seguintes finalidades:
        <br /><br />
        <strong>I.</strong> Comunicação e relacionamento com apoiadores;<br />
        <strong>II.</strong> Envio de informações sobre ações, projetos e iniciativas de interesse público;<br />
        <strong>III.</strong> Mobilização de apoiadores e convites para eventos;<br />
        <strong>IV.</strong> Ações de participação cidadã.<br />
        <br />
        Os dados coletados <strong>não serão obtidos a partir do cadastro eleitoral da Justiça
        Eleitoral</strong>, sendo fornecidos voluntariamente pelo titular, mediante consentimento
        livre, informado e inequívoco, para as finalidades descritas neste termo.<br />
        <br />
        O tratamento observará os princípios da <strong>Lei Geral de Proteção de Dados
        (Lei nº 13.709/2018 — LGPD)</strong> e das normas aplicáveis do TSE.<br />
        <br />
        Os dados <strong>não serão compartilhados com terceiros</strong> sem novo consentimento
        e serão utilizados exclusivamente para as finalidades acima descritas.<br />
        <br />
        O titular poderá <strong>revogar este consentimento a qualquer momento</strong>,
        respondendo <strong>SAIR</strong> a qualquer mensagem recebida, ou solicitando a
        exclusão dos seus dados ao responsável por este cadastro.<br />
        <br />
        <span style={{ color: '#64748b', fontSize: '11px' }}>
          Versão 2.0 — Junho/2026 | Base legal: Art. 7º, I e Art. 11, I da LGPD
        </span>
      </p>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={aceito}
          onChange={e => onChange(e.target.checked)}
          style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#1e40af' }}
        />
        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
          Li e aceito o Termo de Consentimento para tratamento dos meus dados pessoais,
          conforme a LGPD (Lei nº 13.709/2018) e as normas do TSE.
          (Versão 2.0 — Junho/2026)
        </span>
      </label>
    </div>
  );
}
