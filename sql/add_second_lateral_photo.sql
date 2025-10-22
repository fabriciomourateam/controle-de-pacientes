-- Adicionar segunda foto lateral para dados iniciais do paciente
-- Execute este script no Supabase SQL Editor

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS foto_inicial_lado_2 TEXT;

COMMENT ON COLUMN patients.foto_inicial_lado_2 IS 'URL da segunda foto lateral inicial do paciente (outro lado)';

