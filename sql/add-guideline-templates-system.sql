-- Sistema de Templates de Orientações
-- Permite criar orientações favoritas que aparecem automaticamente em novos planos

-- 1. Remover constraint de foreign key para permitir templates sem plano
ALTER TABLE diet_guidelines
DROP CONSTRAINT IF EXISTS diet_guidelines_diet_plan_id_fkey;

-- 2. Adicionar campos necessários à tabela diet_guidelines
ALTER TABLE diet_guidelines
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Recriar constraint como opcional (permite NULL para templates)
ALTER TABLE diet_guidelines
ALTER COLUMN diet_plan_id DROP NOT NULL;

-- 4. Adicionar constraint que valida: se não é template, deve ter diet_plan_id
ALTER TABLE diet_guidelines
ADD CONSTRAINT diet_guidelines_plan_or_template_check
CHECK (
  (is_template = TRUE AND diet_plan_id IS NULL) OR
  (is_template = FALSE AND diet_plan_id IS NOT NULL)
);

-- 5. Recriar foreign key como opcional
ALTER TABLE diet_guidelines
ADD CONSTRAINT diet_guidelines_diet_plan_id_fkey
FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_diet_guidelines_is_template 
ON diet_guidelines(is_template) WHERE is_template = TRUE;

CREATE INDEX IF NOT EXISTS idx_diet_guidelines_user_id 
ON diet_guidelines(user_id);

CREATE INDEX IF NOT EXISTS idx_diet_guidelines_is_active 
ON diet_guidelines(is_active);

-- 3. Atualizar RLS policies para templates

-- Policy para SELECT: usuário pode ver seus próprios templates e orientações de seus planos
DROP POLICY IF EXISTS "Users can view their own guidelines" ON diet_guidelines;
CREATE POLICY "Users can view their own guidelines" ON diet_guidelines
FOR SELECT USING (
  -- Templates do próprio usuário
  (is_template = TRUE AND user_id = auth.uid())
  OR
  -- Orientações de planos do próprio usuário
  (is_template = FALSE AND diet_plan_id IN (
    SELECT id FROM diet_plans WHERE user_id = auth.uid()
  ))
  OR
  -- Membros da equipe podem ver orientações dos planos do owner
  (is_template = FALSE AND diet_plan_id IN (
    SELECT dp.id 
    FROM diet_plans dp
    WHERE EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.owner_id = dp.user_id
      AND tm.is_active = true
    )
  ))
);

-- Policy para INSERT: usuário pode criar templates e orientações em seus planos
DROP POLICY IF EXISTS "Users can create their own guidelines" ON diet_guidelines;
CREATE POLICY "Users can create their own guidelines" ON diet_guidelines
FOR INSERT WITH CHECK (
  -- Templates: user_id deve ser o usuário autenticado
  (is_template = TRUE AND user_id = auth.uid())
  OR
  -- Orientações de planos: plano deve pertencer ao usuário
  (is_template = FALSE AND diet_plan_id IN (
    SELECT id FROM diet_plans WHERE user_id = auth.uid()
  ))
  OR
  -- Membros da equipe podem criar orientações nos planos do owner
  (is_template = FALSE AND diet_plan_id IN (
    SELECT dp.id 
    FROM diet_plans dp
    WHERE EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.owner_id = dp.user_id
      AND tm.is_active = true
    )
  ))
);

-- Policy para UPDATE: usuário pode atualizar seus templates e orientações de seus planos
DROP POLICY IF EXISTS "Users can update their own guidelines" ON diet_guidelines;
CREATE POLICY "Users can update their own guidelines" ON diet_guidelines
FOR UPDATE USING (
  -- Templates do próprio usuário
  (is_template = TRUE AND user_id = auth.uid())
  OR
  -- Orientações de planos do próprio usuário
  (is_template = FALSE AND diet_plan_id IN (
    SELECT id FROM diet_plans WHERE user_id = auth.uid()
  ))
  OR
  -- Membros da equipe podem atualizar orientações dos planos do owner
  (is_template = FALSE AND diet_plan_id IN (
    SELECT dp.id 
    FROM diet_plans dp
    WHERE EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.owner_id = dp.user_id
      AND tm.is_active = true
    )
  ))
);

-- Policy para DELETE: usuário pode deletar seus templates e orientações de seus planos
DROP POLICY IF EXISTS "Users can delete their own guidelines" ON diet_guidelines;
CREATE POLICY "Users can delete their own guidelines" ON diet_guidelines
FOR DELETE USING (
  -- Templates do próprio usuário
  (is_template = TRUE AND user_id = auth.uid())
  OR
  -- Orientações de planos do próprio usuário
  (is_template = FALSE AND diet_plan_id IN (
    SELECT id FROM diet_plans WHERE user_id = auth.uid()
  ))
  OR
  -- Membros da equipe podem deletar orientações dos planos do owner
  (is_template = FALSE AND diet_plan_id IN (
    SELECT dp.id 
    FROM diet_plans dp
    WHERE EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.owner_id = dp.user_id
      AND tm.is_active = true
    )
  ))
);

-- 4. Função para copiar templates para um novo plano
CREATE OR REPLACE FUNCTION copy_guideline_templates_to_plan(
  p_diet_plan_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copiar todos os templates ativos do usuário para o novo plano
  INSERT INTO diet_guidelines (
    diet_plan_id,
    guideline_type,
    title,
    content,
    priority,
    is_template,
    is_active,
    user_id
  )
  SELECT
    p_diet_plan_id,
    guideline_type,
    title,
    content,
    priority,
    FALSE, -- Não é mais template, é uma cópia
    TRUE,  -- Ativo por padrão
    NULL   -- user_id é NULL para orientações de planos
  FROM diet_guidelines
  WHERE is_template = TRUE
    AND user_id = p_user_id
    AND is_active = TRUE
  ORDER BY priority ASC;
END;
$$;

-- 5. Comentários para documentação
COMMENT ON COLUMN diet_guidelines.is_template IS 'Indica se esta orientação é um template global (favorita) que será copiada para novos planos';
COMMENT ON COLUMN diet_guidelines.user_id IS 'ID do usuário dono do template. NULL para orientações de planos específicos';
COMMENT ON COLUMN diet_guidelines.is_active IS 'Indica se a orientação está ativa. Pode ser desativada em planos específicos sem deletar';
COMMENT ON FUNCTION copy_guideline_templates_to_plan IS 'Copia todos os templates ativos do usuário para um novo plano alimentar';

-- 6. Atualizar orientações existentes
-- Todas as orientações existentes não são templates e estão ativas
UPDATE diet_guidelines
SET 
  is_template = FALSE,
  is_active = TRUE,
  user_id = NULL
WHERE is_template IS NULL;

-- Sucesso!
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Templates de Orientações criado com sucesso!';
  RAISE NOTICE '📋 Novos campos: is_template, user_id, is_active';
  RAISE NOTICE '🔒 RLS policies atualizadas';
  RAISE NOTICE '⚡ Função copy_guideline_templates_to_plan() criada';
END $$;
