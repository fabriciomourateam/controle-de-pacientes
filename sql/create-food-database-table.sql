-- Criar tabela food_database se não existir
CREATE TABLE IF NOT EXISTS food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  calories_per_100g NUMERIC(8, 2) NOT NULL,
  protein_per_100g NUMERIC(8, 2) DEFAULT 0,
  carbs_per_100g NUMERIC(8, 2) DEFAULT 0,
  fats_per_100g NUMERIC(8, 2) DEFAULT 0,
  common_units JSONB DEFAULT '["g", "kg", "unidade", "colher de sopa", "colher de chá", "xícara"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicatas
  CONSTRAINT unique_food_name UNIQUE (name)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_food_database_name ON food_database(name);
CREATE INDEX IF NOT EXISTS idx_food_database_category ON food_database(category);
CREATE INDEX IF NOT EXISTS idx_food_database_active ON food_database(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_food_database_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_food_database_updated_at
BEFORE UPDATE ON food_database
FOR EACH ROW
EXECUTE FUNCTION update_food_database_updated_at();

-- Comentários
COMMENT ON TABLE food_database IS 'Banco de dados de alimentos baseado na Tabela TACO';
COMMENT ON COLUMN food_database.name IS 'Nome do alimento';
COMMENT ON COLUMN food_database.category IS 'Categoria do alimento (ex: Cereais e derivados)';
COMMENT ON COLUMN food_database.calories_per_100g IS 'Calorias por 100g';
COMMENT ON COLUMN food_database.protein_per_100g IS 'Proteínas por 100g';
COMMENT ON COLUMN food_database.carbs_per_100g IS 'Carboidratos por 100g';
COMMENT ON COLUMN food_database.fats_per_100g IS 'Gorduras por 100g';







