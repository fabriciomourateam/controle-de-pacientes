-- Tabela para armazenar pacientes excluídos da lista de retenção
-- Permite que cada nutricionista remova pacientes específicos da sua lista de retenção

CREATE TABLE IF NOT EXISTS retention_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  excluded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT, -- Opcional: motivo da exclusão (ex: "já contatado", "não quer contatar")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que um paciente só pode ser excluído uma vez por nutricionista
  UNIQUE(user_id, patient_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_retention_exclusions_user_id ON retention_exclusions(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_exclusions_patient_id ON retention_exclusions(patient_id);
CREATE INDEX IF NOT EXISTS idx_retention_exclusions_excluded_at ON retention_exclusions(excluded_at);

-- Habilitar RLS
ALTER TABLE retention_exclusions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias exclusões
DROP POLICY IF EXISTS "Users can view their own exclusions" ON retention_exclusions;
CREATE POLICY "Users can view their own exclusions"
  ON retention_exclusions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários só podem criar suas próprias exclusões
DROP POLICY IF EXISTS "Users can create their own exclusions" ON retention_exclusions;
CREATE POLICY "Users can create their own exclusions"
  ON retention_exclusions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem deletar suas próprias exclusões
DROP POLICY IF EXISTS "Users can delete their own exclusions" ON retention_exclusions;
CREATE POLICY "Users can delete their own exclusions"
  ON retention_exclusions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE retention_exclusions IS 'Armazena pacientes excluídos da lista de retenção por nutricionista';
COMMENT ON COLUMN retention_exclusions.user_id IS 'ID do nutricionista que excluiu o paciente';
COMMENT ON COLUMN retention_exclusions.patient_id IS 'ID do paciente excluído';
COMMENT ON COLUMN retention_exclusions.excluded_at IS 'Data/hora da exclusão';
COMMENT ON COLUMN retention_exclusions.reason IS 'Motivo opcional da exclusão';

