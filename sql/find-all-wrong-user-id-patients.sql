-- ============================================
-- ENCONTRAR TODOS OS PACIENTES COM user_id INCORRETO
-- ============================================

-- 1. Encontrar pacientes que NÃO pertencem ao usuário logado
--    e NÃO são NULL e NÃO pertencem ao owner da equipe
SELECT 
  'Pacientes com user_id incorreto' as info,
  COUNT(*) as total_problema,
  COUNT(DISTINCT user_id) as user_ids_diferentes
FROM patients
WHERE user_id IS NOT NULL
  AND user_id != auth.uid()
  AND (get_member_owner_id() IS NULL OR user_id != get_member_owner_id());

-- 2. Listar alguns exemplos
SELECT 
  id,
  nome,
  telefone,
  user_id,
  created_at
FROM patients
WHERE user_id IS NOT NULL
  AND user_id != auth.uid()
  AND (get_member_owner_id() IS NULL OR user_id != get_member_owner_id())
ORDER BY created_at DESC
LIMIT 20;

-- 3. Verificar quantos pacientes têm cada user_id diferente
SELECT 
  'Distribuição de user_ids' as info,
  user_id,
  COUNT(*) as total_pacientes,
  CASE 
    WHEN user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid THEN '✅ Seu user_id correto'
    WHEN user_id = auth.uid() THEN '✅ Usuário logado atual'
    ELSE '❌ Outro user_id'
  END as status
FROM patients
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY total_pacientes DESC;
