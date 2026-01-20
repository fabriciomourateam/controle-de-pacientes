-- Corrigir tabela diet_guidelines para permitir templates sem diet_plan_id
-- Este script permite que diet_plan_id seja NULL para templates

-- 1. Remover constraint NOT NULL da coluna diet_plan_id
ALTER TABLE diet_guidelines
ALTER COLUMN diet_plan_id DROP NOT NULL;

-- 2. Remover constraint de foreign key existente
ALTER TABLE diet_guidelines
DROP CONSTRAINT IF EXISTS diet_guidelines_diet_plan_id_fkey;

-- 3. Adicionar campos necessários se não existirem
ALTER TABLE diet_guidelines
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Recriar foreign key como opcional (permite NULL)
ALTER TABLE diet_guidelines
ADD CONSTRAINT diet_guidelines_diet_plan_id_fkey
FOREIGN KEY (diet_plan_id) 
REFERENCES diet_plans(id) 
ON DELETE CASCADE;

-- 5. Adicionar constraint de validação
ALTER TABLE diet_guidelines
DROP CONSTRAINT IF EXISTS diet_guidelines_plan_or_template_check;

ALTER TABLE diet_guidelines
ADD CONSTRAINT diet_guidelines_plan_or_template_check
CHECK (
  (is_template = TRUE AND diet_plan_id IS NULL) OR
  (is_template = FALSE AND diet_plan_id IS NOT NULL)
);

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_diet_guidelines_is_template 
ON diet_guidelines(is_template) WHERE is_template = TRUE;

CREATE INDEX IF NOT EXISTS idx_diet_guidelines_user_id 
ON diet_guidelines(user_id);

CREATE INDEX IF NOT EXISTS idx_diet_guidelines_is_active 
ON diet_guidelines(is_active);

-- 7. Atualizar registros existentes
UPDATE diet_guidelines
SET 
  is_template = FALSE,
  is_active = TRUE,
  user_id = NULL
WHERE is_template IS NULL;

-- Verificar estrutura
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna diet_plan_id agora permite NULL';
  RAISE NOTICE '✅ Constraint de validação criada';
  RAISE NOTICE '✅ Índices criados';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Agora você pode criar templates com diet_plan_id = NULL';
END $$;
