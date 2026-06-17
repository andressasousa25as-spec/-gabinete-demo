export default function TermoConsentimento({ aceito, onChange, disabled = false }) {
  return (
    <div style={{ 
      border: '1px solid #cbd5e1', 
      borderRadius: '12px', 
      padding: '20px',
      backgroundColor: '#f8fafc',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <input
          type="checkbox"
          checked={aceito}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#1e40af' }}
        />
        <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#334155' }}>
          <strong>Termo de Consentimento para Tratamento de Dados</strong>
          <br /><br />
          Eu autorizo o tratamento dos meus dados pessoais (nome, telefone, endereço, 
          geolocalização, zona e seção eleitoral) para fins de comunicação, 
          atendimento e comunicação política, nos termos da
          Lei Geral de Proteção de Dados (LGPD) e das normas do TSE.
          <br /><br />
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Versão 1.0 | Maio/2026
          </span>
        </div>
      </div>
    </div>
  );
}