-- Diagnóstico completo da tabela food_database
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe e sua estrutura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'food_database'
ORDER BY ordinal_position;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'food_database';

-- 3. Listar todas as políticas RLS da tabela food_database
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'food_database'
ORDER BY policyname;

-- 4. Contar quantos alimentos existem na tabela
SELECT COUNT(*) as total_alimentos
FROM food_database;

-- 5. Contar quantos alimentos ativos existem
SELECT COUNT(*) as total_alimentos_ativos
FROM food_database
WHERE is_active = true;

-- 6. Verificar se há coluna user_id
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'food_database' 
        AND column_name = 'user_id'
    ) THEN 'Coluna user_id existe'
    ELSE 'Coluna user_id NÃO existe'
  END as status_user_id;

-- 7. Mostrar alguns alimentos de exemplo
SELECT 
  id,
  name,
  category,
  calories,
  protein,
  carbs,
  fat,
  is_active
FROM food_database
WHERE is_active = true
LIMIT 10;

-- 8. Verificar distribuição por categoria
SELECT 
  category,
  COUNT(*) as total
FROM food_database
WHERE is_active = true
GROUP BY category
ORDER BY total DESC;
