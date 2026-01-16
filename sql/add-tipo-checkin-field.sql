-- Adicionar campo tipo_checkin à tabela checkin
-- Este campo diferencia check-ins completos (com formulário) de registros de evolução (apenas fotos/medidas)

-- 1. Adicionar a coluna tipo_checkin
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS tipo_checkin TEXT DEFAULT 'completo' CHECK (tipo_checkin IN ('completo', 'evolucao'));

-- 2. Criar comentário explicativo
COMMENT ON COLUMN checkin.tipo_checkin IS 'Tipo do check-in: "completo" = check-in com formulário completo, "evolucao" = registro de evolução (fotos/medidas apenas)';

-- 3. Atualizar registros existentes para 'completo' (check-ins já cadastrados)
UPDATE checkin 
SET tipo_checkin = 'completo' 
WHERE tipo_checkin IS NULL;

-- 4. Criar índice para melhorar performance de queries filtradas
CREATE INDEX IF NOT EXISTS idx_checkin_tipo ON checkin(tipo_checkin);

-- 5. Criar índice composto para queries comuns (telefone + tipo)
CREATE INDEX IF NOT EXISTS idx_checkin_telefone_tipo ON checkin(telefone, tipo_checkin);

-- Verificar a estrutura atualizada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'checkin' AND column_name = 'tipo_checkin';
