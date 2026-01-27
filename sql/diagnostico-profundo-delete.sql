-- ============================================
-- DIAGNÓSTICO PROFUNDO: Por que DELETE não funciona?
-- ============================================

-- 1. Seu user_id atual (quem está logado)
SELECT auth.uid() as "Meu user_id atual";

-- 2. Ver o checkin que você está tentando deletar
SELECT 
  id,
  telefone,
  data_checkin,
  user_id as "user_id do checkin",
  created_at
FROM checkin 
WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a';

-- 3. Comparar: seu user_id VS user_id do checkin
SELECT 
  auth.uid() as "Meu user_id",
  c.user_id as "user_id do checkin",
  CASE 
    WHEN auth.uid() = c.user_id THEN '✅ SÃO IGUAIS - DELETE DEVERIA FUNCIONAR'
    ELSE '❌ SÃO DIFERENTES - POR ISSO NÃO DELETA'
  END as "Resultado"
FROM checkin c
WHERE c.id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a';

-- 4. Ver TODOS os checkins deste paciente e seus user_ids
SELECT 
  id,
  data_checkin,
  user_id,
  telefone,
  CASE 
    WHEN user_id = auth.uid() THEN '✅ Você pode deletar'
    ELSE '❌ Você NÃO pode deletar'
  END as "Permissão"
FROM checkin 
WHERE telefone = '559984161569'
ORDER BY data_checkin DESC;

-- 5. Ver se há múltiplos user_ids para este paciente
SELECT 
  user_id,
  COUNT(*) as "Quantidade de checkins"
FROM checkin 
WHERE telefone = '559984161569'
GROUP BY user_id;

-- 6. Ver políticas de DELETE ativas
SELECT 
  policyname,
  cmd,
  qual as "Condição"
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';
