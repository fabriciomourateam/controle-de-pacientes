-- Adicionar campo is_released para controlar se a dieta está liberada para o paciente
ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT FALSE;

-- Adicionar campos de metas (target) se não existirem
ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_calories NUMERIC(10,2);

ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_protein NUMERIC(10,2);

ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_carbs NUMERIC(10,2);

ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_fats NUMERIC(10,2);

-- Comentários para documentação
COMMENT ON COLUMN diet_plans.is_released IS 'Indica se o plano está liberado para visualização no portal do paciente';
COMMENT ON COLUMN diet_plans.target_calories IS 'Meta de calorias diárias calculada pelo TMB/GET';
COMMENT ON COLUMN diet_plans.target_protein IS 'Meta de proteínas diárias em gramas';
COMMENT ON COLUMN diet_plans.target_carbs IS 'Meta de carboidratos diários em gramas';
COMMENT ON COLUMN diet_plans.target_fats IS 'Meta de gorduras diárias em gramas';
