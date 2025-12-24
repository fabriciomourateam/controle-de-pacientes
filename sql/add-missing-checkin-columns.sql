-- Adicionar apenas as colunas que estão faltando na tabela checkin
-- Baseado na estrutura atual fornecida

-- PARTE 1: Adicionar colunas que estão faltando
ALTER TABLE checkin ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE checkin ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE checkin ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);
ALTER TABLE checkin ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE checkin ADD COLUMN IF NOT EXISTS notes_count INTEGER DEFAULT 0;

-- PARTE 2: Adicionar coluna data_preenchimento se não existir (usada no frontend)
ALTER TABLE checkin ADD COLUMN IF NOT EXISTS data_preenchimento TIMESTAMP WITH TIME ZONE;

-- Finalizado - colunas adicionadas!
SELECT 'Colunas adicionadas com sucesso!' as resultado;