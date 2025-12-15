-- ============================================
-- DIAGNOSTICAR ACESSO DO MEMBRO DA EQUIPE
-- ============================================
-- Execute este SQL enquanto estiver logado como day@fmteam.com

-- 1. Verificar quem você é
SELECT 
  auth.uid() as meu_user_id,
  auth.email() as meu_email;

-- 2. Verificar se você é membro de alguma equipe
SELECT 
  id,
  owner_id,
  user_id,
  email,
  name,
  role_id,
  is_active,
  permissions
FROM team_members
WHERE user_id = auth.uid();

-- 3. Verificar quantos pacientes o OWNER tem
SELECT 
  COUNT(*) as total_pacientes_owner,
  user_id as owner_user_id
FROM patients
WHERE user_id IN (
  SELECT owner_id FROM team_members WHERE user_id = auth.uid()
)
GROUP BY user_id;

-- 4. Verificar quantos pacientes VOCÊ vê (com as políticas RLS)
SELECT COUNT(*) as pacientes_que_vejo FROM patients;

-- 5. Verificar as políticas RLS de patients
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'patients';

-- 6. Testar a query da política manualmente
SELECT 
  'Sou owner?' as teste,
  (SELECT user_id = auth.uid() FROM patients LIMIT 1) as resultado_owner,
  'Sou membro?' as teste2,
  (SELECT auth.uid() IN (
    SELECT tm.user_id 
    FROM team_members tm
    WHERE tm.is_active = true
  )) as resultado_membro;

-- 7. Verificar se o owner_id do team_members bate com user_id dos patients
SELECT 
  tm.owner_id as owner_no_team_members,
  COUNT(DISTINCT p.user_id) as owners_em_patients,
  COUNT(p.id) as total_pacientes
FROM team_members tm
LEFT JOIN patients p ON p.user_id = tm.owner_id
WHERE tm.user_id = auth.uid()
GROUP BY tm.owner_id;
