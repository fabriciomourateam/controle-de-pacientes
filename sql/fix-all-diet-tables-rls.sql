-- ============================================================================
-- CORRIGIR RLS DE TODAS AS TABELAS DE DIETAS
-- ============================================================================

-- 1. DIET_PLANS (já tem política, mas vamos garantir)
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_plans_all" ON diet_plans;
CREATE POLICY "diet_plans_all"
  ON diet_plans FOR ALL
  USING ((user_id = auth.uid()) OR is_team_member(user_id))
  WITH CHECK ((user_id = auth.uid()) OR is_team_member(user_id));

-- 2. DIET_MEALS (já tem política, mas vamos garantir)
ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_meals_all" ON diet_meals;
CREATE POLICY "diet_meals_all"
  ON diet_meals FOR ALL
  USING ((user_id = auth.uid()) OR is_team_member(user_id))
  WITH CHECK ((user_id = auth.uid()) OR is_team_member(user_id));

-- 3. DIET_FOODS (FALTAVA!)
ALTER TABLE diet_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_foods_all" ON diet_foods;
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

-- 4. DIET_GUIDELINES (orientações da dieta)
ALTER TABLE diet_guidelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_guidelines_all" ON diet_guidelines;
CREATE POLICY "diet_guidelines_all"
  ON diet_guidelines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans dp
      WHERE dp.id = diet_guidelines.diet_plan_id
        AND (dp.user_id = auth.uid() OR is_team_member(dp.user_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_plans dp
      WHERE dp.id = diet_guidelines.diet_plan_id
        AND (dp.user_id = auth.uid() OR is_team_member(dp.user_id))
    )
  );

-- 5. DIET_QUESTIONS (perguntas sobre a dieta)
ALTER TABLE diet_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_questions_all" ON diet_questions;
CREATE POLICY "diet_questions_all"
  ON diet_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans dp
      WHERE dp.id = diet_questions.diet_plan_id
        AND (dp.user_id = auth.uid() OR is_team_member(dp.user_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_plans dp
      WHERE dp.id = diet_questions.diet_plan_id
        AND (dp.user_id = auth.uid() OR is_team_member(dp.user_id))
    )
  );

-- 6. DIET_PLAN_TEMPLATES (templates de dietas)
ALTER TABLE diet_plan_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_plan_templates_all" ON diet_plan_templates;
CREATE POLICY "diet_plan_templates_all"
  ON diet_plan_templates FOR ALL
  USING ((user_id = auth.uid()) OR is_team_member(user_id) OR is_public = true)
  WITH CHECK ((user_id = auth.uid()) OR is_team_member(user_id));

-- 7. DIET_TEMPLATE_MEALS (refeições dos templates)
ALTER TABLE diet_template_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_template_meals_all" ON diet_template_meals;
CREATE POLICY "diet_template_meals_all"
  ON diet_template_meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_templates dpt
      WHERE dpt.id = diet_template_meals.template_id
        AND ((dpt.user_id = auth.uid()) OR is_team_member(dpt.user_id) OR dpt.is_public = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_plan_templates dpt
      WHERE dpt.id = diet_template_meals.template_id
        AND ((dpt.user_id = auth.uid()) OR is_team_member(dpt.user_id))
    )
  );

-- 8. DIET_TEMPLATE_FOODS (alimentos dos templates)
ALTER TABLE diet_template_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_template_foods_all" ON diet_template_foods;
CREATE POLICY "diet_template_foods_all"
  ON diet_template_foods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_template_meals dtm
      JOIN diet_plan_templates dpt ON dpt.id = dtm.template_id
      WHERE dtm.id = diet_template_foods.template_meal_id
        AND ((dpt.user_id = auth.uid()) OR is_team_member(dpt.user_id) OR dpt.is_public = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_template_meals dtm
      JOIN diet_plan_templates dpt ON dpt.id = dtm.template_id
      WHERE dtm.id = diet_template_foods.template_meal_id
        AND ((dpt.user_id = auth.uid()) OR is_team_member(dpt.user_id))
    )
  );

-- 9. FOOD_GROUPS (grupos de alimentos)
ALTER TABLE food_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_groups_all" ON food_groups;
CREATE POLICY "food_groups_all"
  ON food_groups FOR ALL
  USING ((user_id = auth.uid()) OR is_team_member(user_id))
  WITH CHECK ((user_id = auth.uid()) OR is_team_member(user_id));

-- 10. FOOD_GROUP_ITEMS (itens dos grupos)
ALTER TABLE food_group_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_group_items_all" ON food_group_items;
CREATE POLICY "food_group_items_all"
  ON food_group_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM food_groups fg
      WHERE fg.id = food_group_items.group_id
        AND ((fg.user_id = auth.uid()) OR is_team_member(fg.user_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_groups fg
      WHERE fg.id = food_group_items.group_id
        AND ((fg.user_id = auth.uid()) OR is_team_member(fg.user_id))
    )
  );

-- 11. USER_FOOD_DATABASE (banco de alimentos do usuário)
ALTER TABLE user_food_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_food_database_all" ON user_food_database;
CREATE POLICY "user_food_database_all"
  ON user_food_database FOR ALL
  USING ((user_id = auth.uid()) OR is_team_member(user_id))
  WITH CHECK ((user_id = auth.uid()) OR is_team_member(user_id));

-- 12. FOOD_DATABASE (banco de alimentos global - todos podem ler)
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_database_read" ON food_database;
CREATE POLICY "food_database_read"
  ON food_database FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- RESUMO:
-- - Todas as tabelas de dietas agora têm RLS configurado
-- - Você e seus membros têm acesso total
-- - Templates públicos são acessíveis por todos
-- - Banco de alimentos global é leitura para todos
-- ============================================================================
