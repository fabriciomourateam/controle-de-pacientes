-- Diagnosticar erro 400 ao inserir em checkin
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver estrutura completa da tabela checkin
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'checkin'
ORDER BY ordinal_position;

-- 2. Ver constraints (NOT NULL, UNIQUE, etc)
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'checkin'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Ver políticas RLS de INSERT
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
WHERE tablename = 'checkin'
  AND cmd = 'INSERT';
