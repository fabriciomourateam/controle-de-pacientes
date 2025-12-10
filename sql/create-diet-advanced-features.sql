-- =====================================================
-- ESTRUTURAS PARA FUNCIONALIDADES AVANÇADAS DE DIETAS
-- =====================================================

-- 1. BIBLIOTECA DE PLANOS (TEMPLATES)
CREATE TABLE IF NOT EXISTS diet_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'emagrecimento', 'ganho_peso', 'manutencao', 'hipertrofia', 'outros'
  description TEXT,
  total_calories NUMERIC(8, 2),
  total_protein NUMERIC(8, 2),
  total_carbs NUMERIC(8, 2),
  total_fats NUMERIC(8, 2),
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Planos públicos compartilhados
  usage_count INTEGER DEFAULT 0, -- Quantas vezes foi usado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_template_name_per_user UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_diet_plan_templates_user_id ON diet_plan_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_templates_category ON diet_plan_templates(category);
CREATE INDEX IF NOT EXISTS idx_diet_plan_templates_favorite ON diet_plan_templates(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_diet_plan_templates_public ON diet_plan_templates(is_public) WHERE is_public = true;

-- Tabelas relacionadas para templates (refeições e alimentos)
CREATE TABLE IF NOT EXISTS diet_template_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES diet_plan_templates(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_order INTEGER NOT NULL,
  suggested_time TIME,
  calories NUMERIC(8, 2),
  protein NUMERIC(8, 2),
  carbs NUMERIC(8, 2),
  fats NUMERIC(8, 2),
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_template_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_meal_id UUID REFERENCES diet_template_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL,
  unit TEXT NOT NULL,
  calories NUMERIC(8, 2),
  protein NUMERIC(8, 2),
  carbs NUMERIC(8, 2),
  fats NUMERIC(8, 2),
  notes TEXT,
  food_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diet_template_meals_template_id ON diet_template_meals(template_id);
CREATE INDEX IF NOT EXISTS idx_diet_template_foods_meal_id ON diet_template_foods(template_meal_id);

-- 2. FAVORITOS DE ALIMENTOS
CREATE TABLE IF NOT EXISTS user_favorite_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_favorite_food UNIQUE (user_id, food_name)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_user_id ON user_favorite_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_usage ON user_favorite_foods(user_id, usage_count DESC);

-- 3. GRUPOS DE ALIMENTOS (COMBINAÇÕES)
CREATE TABLE IF NOT EXISTS food_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_food_group_name_per_user UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS food_group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES food_groups(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL,
  unit TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_groups_user_id ON food_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_food_group_items_group_id ON food_group_items(group_id);

-- 4. HISTÓRICO DE VERSÕES DE PLANOS
CREATE TABLE IF NOT EXISTS diet_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  total_calories NUMERIC(8, 2),
  total_protein NUMERIC(8, 2),
  total_carbs NUMERIC(8, 2),
  total_fats NUMERIC(8, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_plan_version UNIQUE (plan_id, version_number)
);

CREATE TABLE IF NOT EXISTS diet_plan_version_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES diet_plan_versions(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_order INTEGER NOT NULL,
  suggested_time TIME,
  calories NUMERIC(8, 2),
  protein NUMERIC(8, 2),
  carbs NUMERIC(8, 2),
  fats NUMERIC(8, 2),
  instructions TEXT
);

CREATE TABLE IF NOT EXISTS diet_plan_version_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_meal_id UUID REFERENCES diet_plan_version_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL,
  unit TEXT NOT NULL,
  calories NUMERIC(8, 2),
  protein NUMERIC(8, 2),
  carbs NUMERIC(8, 2),
  fats NUMERIC(8, 2),
  notes TEXT,
  food_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diet_plan_versions_plan_id ON diet_plan_versions(plan_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_version_meals_version_id ON diet_plan_version_meals(version_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_version_foods_meal_id ON diet_plan_version_foods(version_meal_id);

-- 5. ESTATÍSTICAS DE USO DE ALIMENTOS
CREATE TABLE IF NOT EXISTS food_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  meal_type TEXT, -- Tipo de refeição onde foi usado
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_food_meal_stats UNIQUE (user_id, food_name, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_food_usage_stats_user_id ON food_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_food_usage_stats_food_name ON food_usage_stats(food_name);

-- 6. ADICIONAR CAMPOS FALTANTES NAS TABELAS EXISTENTES
DO $$ 
BEGIN
  -- Adicionar campos em diet_plans
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'favorite'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN favorite BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'active'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN template_id UUID REFERENCES diet_plan_templates(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'parent_plan_id'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN parent_plan_id UUID REFERENCES diet_plans(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'is_weekly'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN is_weekly BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar campos em diet_meals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_meals' AND column_name = 'suggested_time'
  ) THEN
    ALTER TABLE diet_meals ADD COLUMN suggested_time TIME;
  END IF;

  -- Adicionar campos em food_database para análise nutricional
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'food_database' AND column_name = 'fiber_per_100g'
  ) THEN
    ALTER TABLE food_database ADD COLUMN fiber_per_100g NUMERIC(8, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'food_database' AND column_name = 'sodium_per_100g'
  ) THEN
    ALTER TABLE food_database ADD COLUMN sodium_per_100g NUMERIC(8, 2) DEFAULT 0;
  END IF;
END $$;

-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION update_diet_plan_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_diet_plan_templates_updated_at
BEFORE UPDATE ON diet_plan_templates
FOR EACH ROW
EXECUTE FUNCTION update_diet_plan_templates_updated_at();

CREATE OR REPLACE FUNCTION update_food_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_food_groups_updated_at
BEFORE UPDATE ON food_groups
FOR EACH ROW
EXECUTE FUNCTION update_food_groups_updated_at();

-- 8. RLS (Row Level Security)
ALTER TABLE diet_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_template_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_template_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_version_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_version_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_usage_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para diet_plan_templates
CREATE POLICY "Users can view their own templates"
  ON diet_plan_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own templates"
  ON diet_plan_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON diet_plan_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON diet_plan_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para diet_template_meals
CREATE POLICY "Users can view meals from their templates"
  ON diet_template_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_templates 
      WHERE id = template_id 
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can manage meals from their templates"
  ON diet_template_meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_templates 
      WHERE id = template_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas RLS para diet_template_foods
CREATE POLICY "Users can view foods from their template meals"
  ON diet_template_foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diet_template_meals tm
      JOIN diet_plan_templates t ON t.id = tm.template_id
      WHERE tm.id = template_meal_id 
      AND (t.user_id = auth.uid() OR t.is_public = true)
    )
  );

CREATE POLICY "Users can manage foods from their template meals"
  ON diet_template_foods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_template_meals tm
      JOIN diet_plan_templates t ON t.id = tm.template_id
      WHERE tm.id = template_meal_id 
      AND t.user_id = auth.uid()
    )
  );

-- Políticas RLS para user_favorite_foods
CREATE POLICY "Users can manage their own favorite foods"
  ON user_favorite_foods FOR ALL
  USING (auth.uid() = user_id);

-- Políticas RLS para food_groups
CREATE POLICY "Users can manage their own food groups"
  ON food_groups FOR ALL
  USING (auth.uid() = user_id);

-- Políticas RLS para food_group_items
CREATE POLICY "Users can manage items from their food groups"
  ON food_group_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM food_groups 
      WHERE id = group_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas RLS para diet_plan_versions
CREATE POLICY "Users can view versions of their plans"
  ON diet_plan_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans 
      WHERE id = plan_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage versions of their plans"
  ON diet_plan_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans 
      WHERE id = plan_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas RLS para diet_plan_version_meals e foods
CREATE POLICY "Users can view version meals from their plans"
  ON diet_plan_version_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_versions v
      JOIN diet_plans p ON p.id = v.plan_id
      WHERE v.id = version_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage version meals from their plans"
  ON diet_plan_version_meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_versions v
      JOIN diet_plans p ON p.id = v.plan_id
      WHERE v.id = version_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view version foods from their plans"
  ON diet_plan_version_foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_version_foods vf
      JOIN diet_plan_version_meals vm ON vm.id = vf.version_meal_id
      JOIN diet_plan_versions v ON v.id = vm.version_id
      JOIN diet_plans p ON p.id = v.plan_id
      WHERE vf.version_meal_id = vm.id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage version foods from their plans"
  ON diet_plan_version_foods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_plan_version_foods vf
      JOIN diet_plan_version_meals vm ON vm.id = vf.version_meal_id
      JOIN diet_plan_versions v ON v.id = vm.version_id
      JOIN diet_plans p ON p.id = v.plan_id
      WHERE vf.version_meal_id = vm.id 
      AND p.user_id = auth.uid()
    )
  );

-- Políticas RLS para food_usage_stats
CREATE POLICY "Users can manage their own food usage stats"
  ON food_usage_stats FOR ALL
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE diet_plan_templates IS 'Biblioteca de planos alimentares reutilizáveis (templates)';
COMMENT ON TABLE user_favorite_foods IS 'Alimentos favoritos de cada nutricionista';
COMMENT ON TABLE food_groups IS 'Grupos de alimentos pré-definidos (combinações)';
COMMENT ON TABLE diet_plan_versions IS 'Histórico de versões de planos alimentares';
COMMENT ON TABLE food_usage_stats IS 'Estatísticas de uso de alimentos por nutricionista';








