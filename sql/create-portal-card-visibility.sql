-- Tabela para controlar visibilidade de cards no portal público do paciente
-- Permite ocultar seções (ex: Evolução Fotográfica) da página que o cliente final vê

CREATE TABLE IF NOT EXISTS portal_card_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_telefone TEXT NOT NULL,
  card_key TEXT NOT NULL, -- ex: 'evolution_photos', 'evolution_charts'
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_telefone, card_key)
);

CREATE INDEX IF NOT EXISTS idx_portal_card_visibility_telefone
ON portal_card_visibility(patient_telefone);

CREATE OR REPLACE FUNCTION update_portal_card_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_portal_card_visibility_updated_at ON portal_card_visibility;
CREATE TRIGGER trigger_update_portal_card_visibility_updated_at
BEFORE UPDATE ON portal_card_visibility
FOR EACH ROW
EXECUTE FUNCTION update_portal_card_visibility_updated_at();

ALTER TABLE portal_card_visibility ENABLE ROW LEVEL SECURITY;

-- Owner pode gerenciar
CREATE POLICY portal_card_visibility_owner_policy ON portal_card_visibility
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.telefone = portal_card_visibility.patient_telefone
    AND patients.user_id = auth.uid()
  )
);

-- Equipe pode ver e atualizar (mesmo padrão de photo_visibility)
CREATE POLICY portal_card_visibility_team_select ON portal_card_visibility
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = portal_card_visibility.patient_telefone
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY portal_card_visibility_team_all ON portal_card_visibility
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = portal_card_visibility.patient_telefone
    AND tm.user_id = auth.uid()
  )
);

-- Serviço/anon precisa ler para a página pública (portal por link)
-- Se o portal público usar service role, essa política não é necessária para o backend.
-- Para leitura pública por link, pode ser necessário uma policy que permita SELECT por patient_telefone.
-- Aqui assumimos que a página pública é carregada com service role ou que o link já autentica o paciente.
COMMENT ON TABLE portal_card_visibility IS 'Visibilidade de cards no portal público (ex: Evolução Fotográfica). card_key: evolution_photos, etc.';
