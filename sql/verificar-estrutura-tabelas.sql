-- ============================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================

-- 1. Verificar colunas da tabela patients
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'patients'
ORDER BY ordinal_position;

-- 2. Verificar colunas da tabela checkin
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'checkin'
ORDER BY ordinal_position;

-- 3. Verificar se existe user_id em patients
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'patients' 
  AND column_name = 'user_id'
) as patients_tem_user_id;

-- 4. Verificar se existe user_id em checkin
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'checkin' 
  AND column_name = 'user_id'
) as checkin_tem_user_id;

-- 5. Verificar políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('patients', 'checkin')
ORDER BY tablename, policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('patients', 'checkin');
