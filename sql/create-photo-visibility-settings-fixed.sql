-- ============================================
-- TABELA: photo_visibility_settings (VERSÃO CORRIGIDA)
-- Sistema de controle de visibilidade de fotos
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS photo_visibility_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_telefone TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  zoom_level DECIMAL DEFAULT 1.0,
  position_x DECIMAL DEFAULT 0,
  position_y DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_telefone, photo_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_photo_visibility_telefone 
ON photo_visibility_settings(patient_telefone);

CREATE INDEX IF NOT EXISTS idx_photo_visibility_telefone_photo 
ON photo_visibility_settings(patient_telefone, photo_id);

-- Trigger para atualizar updated_at
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

-- Habilitar RLS
ALTER TABLE photo_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Política: Owner pode ver e editar suas configurações
CREATE POLICY photo_visibility_owner_policy ON photo_visibility_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.telefone = photo_visibility_settings.patient_telefone
    AND patients.user_id = auth.uid()
  )
);

-- Política: Membros da equipe podem ver configurações (CORRIGIDA)
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

-- Comentários
COMMENT ON TABLE photo_visibility_settings IS 'Configurações de visibilidade e ajustes (zoom, posição) das fotos de evolução';
COMMENT ON COLUMN photo_visibility_settings.patient_telefone IS 'Telefone do paciente';
COMMENT ON COLUMN photo_visibility_settings.photo_id IS 'ID único da foto: initial-{angle} ou checkin-{id}-foto-{number}';
COMMENT ON COLUMN photo_visibility_settings.visible IS 'Se true, foto é visível para o paciente';
COMMENT ON COLUMN photo_visibility_settings.zoom_level IS 'Nível de zoom (0.5 a 3.0)';
COMMENT ON COLUMN photo_visibility_settings.position_x IS 'Posição horizontal (-100 a 100)';
COMMENT ON COLUMN photo_visibility_settings.position_y IS 'Posição vertical (-100 a 100)';
