-- Diagnóstico completo da tabela de alimentos (foods)
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe e sua estrutura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'foods'
ORDER BY ordinal_position;

-- 2. Verificar RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'foods';

-- 3. Listar todas as políticas RLS da tabela foods
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
  AND tablename = 'foods'
ORDER BY policyname;

-- 4. Contar quantos alimentos existem na tabela
SELECT COUNT(*) as total_alimentos
FROM foods;

-- 5. Verificar se há alimentos com user_id (se a coluna existir)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'foods' 
        AND column_name = 'user_id'
    ) THEN 'Coluna user_id existe'
    ELSE 'Coluna user_id NÃO existe'
  END as status_user_id;

-- 6. Se user_id existir, mostrar distribuição
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'foods' 
      AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'Distribuição de alimentos por user_id:';
    PERFORM user_id, COUNT(*) as total
    FROM foods
    GROUP BY user_id;
  END IF;
END $$;

-- 7. Testar acesso como usuário autenticado (simular)
-- Substitua 'SEU_USER_ID' pelo seu ID real
SELECT 
  id,
  name,
  category,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'foods' 
        AND column_name = 'user_id'
    ) THEN user_id::text
    ELSE 'N/A'
  END as user_id
FROM foods
LIMIT 10;

-- 8. Verificar se há função is_team_member sendo usada
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_team_member';

-- 9. Verificar políticas que usam auth.uid()
SELECT 
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'foods'
  AND qual LIKE '%auth.uid()%';
