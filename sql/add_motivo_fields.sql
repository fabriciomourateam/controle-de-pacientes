-- Adicionar campos de motivo de cancelamento e congelamento na tabela patients

-- Adicionar campo motivo_cancelamento
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- Adicionar campo motivo_congelamento
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS motivo_congelamento TEXT;

-- Comentários para documentação
COMMENT ON COLUMN patients.motivo_cancelamento IS 'Motivo informado pelo aluno para o cancelamento';
COMMENT ON COLUMN patients.motivo_congelamento IS 'Motivo informado pelo aluno para o congelamento';
