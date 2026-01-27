-- Sistema de Alimentos Customizados
-- Permite que cada usuário adicione seus próprios alimentos ao banco de dados

-- 1. Criar tabela de alimentos customizados
CREATE TABLE IF NOT EXISTS custom_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  protein_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fats_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC(10, 2) DEFAULT 0,
  category TEXT, -- Ex: "Proteínas", "Carboidratos", "Gorduras", "Vegetais", etc.
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON custom_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name);
CREATE INDEX IF NOT EXISTS idx_custom_foods_category ON custom_foods(category);
CREATE INDEX IF NOT EXISTS idx_custom_foods_is_favorite ON custom_foods(is_favorite);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_custom_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_foods_updated_at
  BEFORE UPDATE ON custom_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_foods_updated_at();

-- 4. Habilitar RLS
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies de segurança
-- Policy para SELECT: usuário pode ver seus próprios alimentos
CREATE POLICY "users_can_select_own_custom_foods"
ON custom_foods
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  -- Membros da equipe podem ver alimentos do dono
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.owner_id = custom_foods.user_id
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
  )
);

-- Policy para INSERT: usuário pode criar seus próprios alimentos
CREATE POLICY "users_can_insert_own_custom_foods"
ON custom_foods
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy para UPDATE: usuário pode atualizar seus próprios alimentos
CREATE POLICY "users_can_update_own_custom_foods"
ON custom_foods
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy para DELETE: usuário pode deletar seus próprios alimentos
CREATE POLICY "users_can_delete_own_custom_foods"
ON custom_foods
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Inserir alguns alimentos de exemplo (opcional)
-- Você pode descomentar para ter alguns exemplos iniciais
/*
INSERT INTO custom_foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, category)
VALUES 
  (auth.uid(), 'Frango Grelhado Caseiro', 165, 31, 0, 3.6, 'Proteínas'),
  (auth.uid(), 'Batata Doce Cozida', 86, 1.6, 20.1, 0.1, 'Carboidratos'),
  (auth.uid(), 'Azeite Extra Virgem', 884, 0, 0, 100, 'Gorduras');
*/

-- 7. Verificar estrutura criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_foods'
ORDER BY ordinal_position;

-- 8. Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'custom_foods';
