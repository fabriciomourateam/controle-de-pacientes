-- ============================================
-- DIAGNÓSTICO: Por que admin não consegue deletar?
-- ============================================

-- 1. Ver seu user_id atual
SELECT 
  'Seu user_id' as info,
  auth.uid() as user_id;

-- 2. Ver seu role no profiles
SELECT 
  'Seu role' as info,
  id,
  role,
  nome
FROM profiles 
WHERE id = auth.uid();

-- 3. Ver o checkin que você está tentando deletar
SELECT 
  'Checkin que você quer deletar' as info,
  id,
  telefone,
  data_checkin,
  user_id as criado_por,
  created_at
FROM checkin 
WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a';

-- 4. Ver TODAS as políticas de DELETE na tabela checkin
SELECT 
  'Políticas de DELETE' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as condicao,
  with_check
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE'
ORDER BY policyname;

-- 5. Testar se você é admin
SELECT 
  'Você é admin?' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ) THEN 'SIM - Você é admin'
    ELSE 'NÃO - Você não é admin'
  END as resultado;

-- 6. Ver se a política está permitindo
SELECT 
  'Teste da política' as info,
  CASE 
    WHEN (
      -- Você é o dono do checkin
      (SELECT user_id FROM checkin WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a') = auth.uid()
    ) THEN 'Permitido: Você é o dono do checkin'
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ) THEN 'Permitido: Você é admin'
    ELSE 'BLOQUEADO: Você não é dono nem admin'
  END as resultado;

-- 7. Ver se há outras políticas conflitantes
SELECT 
  'Total de políticas DELETE' as info,
  COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';

-- 8. Verificar se RLS está habilitado
SELECT 
  'RLS habilitado?' as info,
  relname as tabela,
  relrowsecurity as rls_habilitado
FROM pg_class 
WHERE relname = 'checkin';
