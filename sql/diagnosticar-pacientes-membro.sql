-- ============================================================================
-- DIAGNÓSTICO - Por que pacientes não aparecem para membros?
-- ============================================================================

-- 1. Verificar se o membro está ativo
SELECT 
  'Dados do Membro' as tipo,
  id,
  owner_id,
  user_id,
  email,
  name,
  is_active,
  role_id
FROM team_members
WHERE user_id = auth.uid();

-- 2. Verificar pacientes do owner
SELECT 
  'Pacientes do Owner' as tipo,
  COUNT(*) as total_pacientes,
  user_id as owner_id
FROM patients
WHERE user_id IN (
  SELECT owner_id FROM team_members WHERE user_id = auth.uid()
)
GROUP BY user_id;

-- 3. Testar função is_team_member
SELECT 
  'Teste is_team_member' as tipo,
  owner_id,
  is_team_member(owner_id) as resultado
FROM team_members
WHERE user_id = auth.uid();

-- 4. Ver alguns pacientes do owner (primeiros 5)
SELECT 
  'Amostra de Pacientes' as tipo,
  id,
  nome,
  telefone,
  user_id
FROM patients
WHERE user_id IN (
  SELECT owner_id FROM team_members WHERE user_id = auth.uid()
)
LIMIT 5;

-- 5. Verificar política RLS de patients
SELECT 
  'Políticas RLS de Patients' as tipo,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'patients';
