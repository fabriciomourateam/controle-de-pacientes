-- ============================================================================
-- CORRIGIR RLS DE DIET_FOODS (ALIMENTOS SUMIRAM!)
-- ============================================================================

-- 1. Habilitar RLS na tabela diet_foods
ALTER TABLE diet_foods ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "diet_foods_all" ON diet_foods;

-- 3. Criar política que permite acesso via diet_meals
-- Usuário pode acessar alimentos se tiver acesso à refeição (meal)
CREATE POLICY "diet_foods_all"
  ON diet_foods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_meals dm
      WHERE dm.id = diet_foods.meal_id
        AND (dm.user_id = auth.uid() OR is_team_member(dm.user_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_meals dm
      WHERE dm.id = diet_foods.meal_id
        AND (dm.user_id = auth.uid() OR is_team_member(dm.user_id))
    )
  );

-- ============================================================================
-- EXPLICAÇÃO:
-- - diet_foods não tinha RLS, então estava bloqueando TUDO
-- - Agora permite acesso se o usuário tiver acesso à refeição (diet_meals)
-- - Funciona para você e para membros da sua equipe
-- ============================================================================
