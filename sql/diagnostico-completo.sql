-- Execute este SQL logado como MEMBRO e me envie TODO o resultado

-- 1. Dados do membro
SELECT 
  'MEMBRO' as info,
  id as membro_id,
  email as membro_email,
  owner_id,
  is_active
FROM team_members
WHERE user_id = auth.uid();

-- 2. Quantos pacientes o owner tem (total no banco)
SELECT 
  'PACIENTES_OWNER_TOTAL' as info,
  user_id as owner_id,
  COUNT(*) as total_pacientes
FROM patients
WHERE user_id = (SELECT owner_id FROM team_members WHERE user_id = auth.uid())
GROUP BY user_id;

-- 3. Quantos pacientes o membro consegue ver (com RLS)
SELECT 
  'PACIENTES_VISIVEIS_MEMBRO' as info,
  COUNT(*) as total_visiveis
FROM patients;

-- 4. Políticas RLS ativas
SELECT 
  'POLITICAS_RLS' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 5. RLS está habilitado?
SELECT 
  'RLS_STATUS' as info,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('patients', 'checkin', 'plans');
