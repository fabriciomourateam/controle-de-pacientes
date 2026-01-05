-- ============================================
-- DIAGNÓSTICO: PÁGINA DE EVOLUÇÃO DO PACIENTE
-- ============================================

-- 1. Verificar dados do paciente
SELECT 
  'Dados do paciente' as info,
  id,
  nome,
  telefone,
  user_id,
  created_at
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone = '5511989330147';

-- 2. Verificar se consegue buscar o paciente pelo telefone (como a página faz)
SELECT 
  'Teste de busca por telefone' as info,
  COUNT(*) as encontrados,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Paciente encontrado'
    ELSE '❌ Paciente NÃO encontrado'
  END as status
FROM patients
WHERE telefone = '5511989330147';

-- 3. Verificar check-ins do paciente
SELECT 
  'Check-ins do paciente' as info,
  COUNT(*) as total_checkins
FROM checkin
WHERE telefone = '5511989330147';

-- 4. Verificar body_composition do paciente
SELECT 
  'Body composition do paciente' as info,
  COUNT(*) as total_avaliacoes
FROM body_composition
WHERE telefone = '5511989330147';

-- 5. Testar acesso RLS para checkin
SELECT 
  'Teste RLS checkin' as info,
  COUNT(*) as checkins_visiveis
FROM checkin
WHERE telefone = '5511989330147'
  AND (
    user_id = auth.uid()
    OR
    (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
    OR
    user_id IS NULL
  );

-- 6. Testar acesso RLS para body_composition
SELECT 
  'Teste RLS body_composition' as info,
  COUNT(*) as avaliacoes_visiveis
FROM body_composition
WHERE telefone = '5511989330147'
  AND (
    user_id = auth.uid()
    OR
    (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
    OR
    user_id IS NULL
  );

-- 7. Verificar se há políticas RLS para checkin e body_composition
SELECT 
  'Políticas RLS checkin' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'checkin'
ORDER BY policyname;

SELECT 
  'Políticas RLS body_composition' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'body_composition'
ORDER BY policyname;
