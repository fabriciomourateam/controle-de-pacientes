-- ============================================================================
-- DIAGNOSTICAR POR QUE MEMBRO ESTÁ SENDO BLOQUEADO
-- ============================================================================

-- 1. Ver dados do admin (via profiles, não auth.users)
SELECT 
  'Admin' as tipo,
  id,
  email,
  created_at
FROM profiles
WHERE email = 'fabriciomouratreinador@gmail.com';

-- 2. Ver profile do admin
SELECT 
  'Profile Admin' as tipo,
  id,
  email,
  full_name
FROM profiles
WHERE email = 'fabriciomouratreinador@gmail.com';

-- 3. Ver todos os membros da equipe do admin
SELECT 
  tm.id,
  tm.user_id as membro_user_id,
  tm.owner_id as admin_user_id,
  tm.email as membro_email,
  tm.status,
  tm.is_active,
  p.email as profile_email
FROM team_members tm
LEFT JOIN profiles p ON p.id = tm.user_id
WHERE tm.owner_id IN (
  SELECT id FROM profiles WHERE email = 'fabriciomouratreinador@gmail.com'
);

-- 4. Ver se o membro tem user_id correto
SELECT 
  'Verificação Cruzada' as tipo,
  p.id as profile_id,
  p.email as profile_email,
  tm.user_id as team_member_user_id,
  tm.email as team_member_email,
  tm.status,
  tm.is_active,
  CASE 
    WHEN p.id = tm.user_id THEN '✅ IDs coincidem'
    ELSE '❌ IDs diferentes'
  END as verificacao
FROM profiles p
LEFT JOIN team_members tm ON tm.user_id = p.id
WHERE tm.id IS NOT NULL  -- Que são membros de equipe
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================================
-- FIM
-- ============================================================================
