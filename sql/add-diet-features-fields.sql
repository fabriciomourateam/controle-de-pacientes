-- =====================================================
-- ADICIONAR CAMPOS PARA NOVAS FUNCIONALIDADES DE DIETAS
-- =====================================================

-- Adicionar campos na tabela diet_meals
DO $$ 
BEGIN
  -- Horário sugerido
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_meals' AND column_name = 'suggested_time'
  ) THEN
    ALTER TABLE diet_meals ADD COLUMN suggested_time TIME;
    RAISE NOTICE 'Campo suggested_time adicionado em diet_meals';
  END IF;

  -- Favorita
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_meals' AND column_name = 'favorite'
  ) THEN
    ALTER TABLE diet_meals ADD COLUMN favorite BOOLEAN DEFAULT false;
    RAISE NOTICE 'Campo favorite adicionado em diet_meals';
  END IF;

  -- Nutricionista ID (para favoritos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_meals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE diet_meals ADD COLUMN user_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Campo user_id adicionado em diet_meals';
  END IF;
END $$;

-- Adicionar campos na tabela diet_plans
DO $$ 
BEGIN
  -- Favorita
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'favorite'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN favorite BOOLEAN DEFAULT false;
    RAISE NOTICE 'Campo favorite adicionado em diet_plans';
  END IF;

  -- Ativa (para sistema de histórico)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' AND column_name = 'active'
  ) THEN
    ALTER TABLE diet_plans ADD COLUMN active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Campo active adicionado em diet_plans';
  END IF;
END $$;

-- Adicionar campo order na tabela diet_foods (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_foods' AND column_name = 'food_order'
  ) THEN
    ALTER TABLE diet_foods ADD COLUMN food_order INTEGER DEFAULT 0;
    RAISE NOTICE 'Campo food_order adicionado em diet_foods';
  END IF;
END $$;

-- Criar índice para favoritos
CREATE INDEX IF NOT EXISTS idx_diet_meals_favorite ON diet_meals(favorite, user_id) WHERE favorite = true;
CREATE INDEX IF NOT EXISTS idx_diet_plans_favorite ON diet_plans(favorite, user_id) WHERE favorite = true;
CREATE INDEX IF NOT EXISTS idx_diet_plans_active ON diet_plans(patient_id, active);

-- Mensagem final
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Campos adicionados com sucesso!';
  RAISE NOTICE '========================================';
END $$;

