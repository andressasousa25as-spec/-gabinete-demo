-- =========================================================
-- Módulo: Gestão de Demandas do Eleitor
-- Ciclo completo: registrar -> acompanhar -> resolver
-- =========================================================

CREATE TABLE IF NOT EXISTS demandas (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolvida_em TIMESTAMPTZ,

  -- Vínculos (opcionais)
  eleitor_id   UUID REFERENCES eleitores(id) ON DELETE SET NULL,
  lideranca_id UUID REFERENCES liderancas(id) ON DELETE SET NULL,

  -- Conteúdo do pedido
  titulo       TEXT NOT NULL,
  descricao    TEXT,
  categoria    TEXT,
  prioridade   TEXT DEFAULT 'Média'  CHECK (prioridade IN ('Baixa','Média','Alta','Urgente')),
  status       TEXT DEFAULT 'Aberta' CHECK (status IN ('Aberta','Em andamento','Resolvida','Cancelada')),
  prazo        DATE,
  responsavel  TEXT
);

CREATE INDEX IF NOT EXISTS idx_demandas_status      ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_eleitor     ON demandas(eleitor_id);
CREATE INDEX IF NOT EXISTS idx_demandas_created_at  ON demandas(created_at DESC);

-- Função de updated_at (idempotente — cria se não existir)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demandas_updated_at ON demandas;
CREATE TRIGGER trg_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS — idêntico às demais tabelas de dados (eleitores, liderancas, anotacoes...):
-- acesso a usuário logado COM licença válida OU master.
-- Reaproveita as funções public.licenca_valida() e public.eh_master()
-- criadas na migration 20260611120000_licenca_e_gate.sql.
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS acesso_logado ON demandas;
CREATE POLICY acesso_logado ON demandas FOR ALL
  TO authenticated
  USING (public.licenca_valida() OR public.eh_master())
  WITH CHECK (public.licenca_valida() OR public.eh_master());
