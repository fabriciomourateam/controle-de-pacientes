-- Tabela para armazenar configurações de visibilidade e ajustes de fotos
-- Permite ao nutricionista controlar quais fotos o paciente vê e como elas são exibidas

CREATE TABLE IF NOT EXISTS photo_visibility_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_telefone TEXT NOT NULL,
  photo_id TEXT NOT NULL, -- formato: "checkin-{id}-foto-{number}" ou "initial-{angle}"
  visible BOOLEAN DEFAULT true,
  zoom_level DECIMAL DEFAULT 1.0, -- 0.5 a 3.0
  position_x DECIMAL DEFAULT 0, -- -100 a 100 (porcentagem)
  position_y DECIMAL DEFAULT 0, -- -100 a 100 (porcentagem)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_telefone, photo_id)
);

-- Índice para busca rápida por telefone do paciente
CREATE INDEX IF NOT EXISTS idx_photo_visibility_telefone 
ON photo_visibility_settings(patient_telefone);

-- Índice para busca por telefone + photo_id
CREATE INDEX IF NOT EXISTS idx_photo_visibility_telefone_photo 
ON photo_visibility_settings(patient_telefone, photo_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_photo_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_photo_visibility_updated_at
BEFORE UPDATE ON photo_visibility_settings
FOR EACH ROW
EXECUTE FUNCTION update_photo_visibility_updated_at();

-- RLS (Row Level Security)
ALTER TABLE photo_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver e editar apenas configurações dos seus próprios pacientes
CREATE POLICY photo_visibility_owner_policy ON photo_visibility_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.telefone = photo_visibility_settings.patient_telefone
    AND patients.user_id = auth.uid()
  )
);

-- Política: Membros da equipe podem ver configurações dos pacientes do owner (CORRIGIDA)
-- Usa user_id ao invés de member_id
CREATE POLICY photo_visibility_team_policy ON photo_visibility_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = photo_visibility_settings.patient_telefone
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
  )
);

-- Comentários para documentação
COMMENT ON TABLE photo_visibility_settings IS 'Configurações de visibilidade e ajustes (zoom, posição) das fotos de evolução dos pacientes';
COMMENT ON COLUMN photo_visibility_settings.patient_telefone IS 'Telefone do paciente (chave de relacionamento)';
COMMENT ON COLUMN photo_visibility_settings.photo_id IS 'ID único da foto no formato: checkin-{id}-foto-{number} ou initial-{angle}';
COMMENT ON COLUMN photo_visibility_settings.visible IS 'Se true, foto é visível para o paciente no portal';
COMMENT ON COLUMN photo_visibility_settings.zoom_level IS 'Nível de zoom aplicado à foto (0.5 = 50%, 1.0 = 100%, 3.0 = 300%)';
COMMENT ON COLUMN photo_visibility_settings.position_x IS 'Posição horizontal da foto em porcentagem (-100 a 100)';
COMMENT ON COLUMN photo_visibility_settings.position_y IS 'Posição vertical da foto em porcentagem (-100 a 100)';
