-- =====================================================
-- TABELA PARA REFEIÇÕES FAVORITAS POR USUÁRIO
-- =====================================================

-- Criar tabela para refeições favoritas
CREATE TABLE IF NOT EXISTS user_favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT NOT NULL,
  suggested_time TIME,
  calories NUMERIC(8, 2) DEFAULT 0,
  protein NUMERIC(8, 2) DEFAULT 0,
  carbs NUMERIC(8, 2) DEFAULT 0,
  fats NUMERIC(8, 2) DEFAULT 0,
  instructions TEXT,
  foods JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de alimentos com suas informações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_favorite_meals_user_id ON user_favorite_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_meals_created_at ON user_favorite_meals(user_id, created_at DESC);

-- Comentários nas colunas
COMMENT ON TABLE user_favorite_meals IS 'Armazena refeições favoritadas por cada usuário/nutricionista';
COMMENT ON COLUMN user_favorite_meals.foods IS 'JSONB contendo array de alimentos com: food_name, quantity, unit, calories, protein, carbs, fats, substitutions, food_order';

