-- ============================================
-- VERIFICAR PACIENTE ESPECÍFICO: Barbara Zara Lamonica
-- ============================================

-- 1. Buscar dados do paciente específico
SELECT 
  id,
  nome,
  telefone,
  user_id,
  created_at,
  updated_at
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone = '5511989330147';  -- Telefone mencionado anteriormente

-- 2. Verificar se o user_id desse paciente corresponde ao usuário logado
SELECT 
  'Verificação de acesso' as info,
  p.nome,
  p.telefone,
  p.user_id as user_id_paciente,
  auth.uid() as user_id_logado,
  CASE 
    WHEN p.user_id = auth.uid() THEN '✅ user_id corresponde'
    WHEN p.user_id IS NULL THEN '⚠️ user_id é NULL'
    ELSE '❌ user_id NÃO corresponde'
  END as status_user_id,
  CASE 
    WHEN p.user_id = get_member_owner_id() THEN '✅ user_id corresponde ao owner da equipe'
    WHEN get_member_owner_id() IS NULL THEN '⚠️ Não é membro da equipe'
    ELSE '❌ user_id NÃO corresponde ao owner da equipe'
  END as status_equipe
FROM patients p
WHERE p.nome ILIKE '%Barbara%Zara%Lamonica%'
   OR p.telefone = '5511989330147';

-- 3. Verificar se a política RLS permite acesso a esse paciente
SELECT 
  'Teste de política RLS' as info,
  p.nome,
  p.telefone,
  p.user_id,
  -- Testar cada condição da política
  (p.user_id = auth.uid()) as condicao_1_owner,
  (get_member_owner_id() IS NOT NULL AND p.user_id = get_member_owner_id()) as condicao_2_membro,
  (p.user_id IS NULL) as condicao_3_null,
  -- Resultado final (deve ser true para ter acesso)
  (
    (p.user_id = auth.uid())
    OR
    (get_member_owner_id() IS NOT NULL AND p.user_id = get_member_owner_id())
    OR
    (p.user_id IS NULL)
  ) as acesso_permitido
FROM patients p
WHERE p.nome ILIKE '%Barbara%Zara%Lamonica%'
   OR p.telefone = '5511989330147';

-- 4. Comparar com outros pacientes que funcionam
SELECT 
  'Comparação com outros pacientes' as info,
  COUNT(*) FILTER (WHERE nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147') as paciente_problema,
  COUNT(*) FILTER (WHERE nome NOT ILIKE '%Barbara%Zara%Lamonica%' AND telefone != '5511989330147') as outros_pacientes,
  COUNT(*) FILTER (WHERE (nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147') AND user_id = auth.uid()) as problema_eh_meu,
  COUNT(*) FILTER (WHERE (nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147') AND user_id IS NULL) as problema_sem_user_id,
  COUNT(*) FILTER (WHERE (nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147') AND user_id != auth.uid() AND user_id IS NOT NULL) as problema_outro_user
FROM patients;
