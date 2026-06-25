export default function TermoConsentimento({ aceito, onChange, disabled = false }) {
  return (
    <div style={{ 
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: 'var(--surface-2)',
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
        <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text)' }}>
          <strong>Termo de Consentimento para Tratamento de Dados</strong>
          <br /><br />
          Eu autorizo o tratamento dos meus dados pessoais (nome, telefone, endereço,
          geolocalização, zona e seção eleitoral) para fins de comunicação, relacionamento
          com apoiadores e convites para eventos, nos termos da
          Lei Geral de Proteção de Dados (LGPD) e das normas do TSE. Os dados são fornecidos
          voluntariamente pelo titular e não são obtidos do cadastro eleitoral da Justiça Eleitoral.
          <br /><br />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Versão 2.0 | Junho/2026
          </span>
        </div>
      </div>
    </div>
  );
}