-- ============================================
-- DIAGNÓSTICO SIMPLES: Estrutura e permissões
-- ============================================

-- 1. Ver estrutura da tabela profiles
SELECT 
  'Colunas da tabela profiles' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Ver seu user_id atual
SELECT 
  'Seu user_id' as info,
  auth.uid() as user_id;

-- 3. Ver seus dados no profiles (sem especificar colunas)
SELECT 
  'Seus dados' as info,
  *
FROM profiles 
WHERE id = auth.uid();

-- 4. Ver o checkin que você está tentando deletar
SELECT 
  'Checkin para deletar' as info,
  id,
  telefone,
  data_checkin,
  user_id as criado_por
FROM checkin 
WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a';

-- 5. Ver TODAS as políticas de DELETE
SELECT 
  'Políticas DELETE' as info,
  policyname,
  cmd,
  qual as condicao
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';
