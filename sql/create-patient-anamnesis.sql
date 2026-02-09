-- Tabela para armazenar anamnese completa do paciente
-- Os dados básicos (nome, telefone, peso_inicial, fotos, etc.) vão para a tabela patients
-- Esta tabela armazena os dados complementares da anamnese em JSONB

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS patient_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_patient_id ON patient_anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_telefone ON patient_anamnesis(telefone);
CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_user_id ON patient_anamnesis(user_id);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_patient_anamnesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_anamnesis_updated_at
  BEFORE UPDATE ON patient_anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_anamnesis_updated_at();

-- 4. Habilitar RLS
ALTER TABLE patient_anamnesis ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies de segurança (mesmo padrão de custom_foods)
-- Policy para SELECT: usuário pode ver anamneses dos seus pacientes
CREATE POLICY "users_can_select_own_anamnesis"
ON patient_anamnesis
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy para INSERT: usuário pode criar anamneses
CREATE POLICY "users_can_insert_own_anamnesis"
ON patient_anamnesis
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy para UPDATE: usuário pode atualizar suas anamneses
CREATE POLICY "users_can_update_own_anamnesis"
ON patient_anamnesis
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy para DELETE: usuário pode deletar suas anamneses
CREATE POLICY "users_can_delete_own_anamnesis"
ON patient_anamnesis
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
