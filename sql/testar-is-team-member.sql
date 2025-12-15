-- ============================================================================
-- TESTAR FUNÇÃO is_team_member
-- ============================================================================
-- Execute este SQL logado como MEMBRO da equipe
-- ============================================================================

-- 1. Ver meu user_id atual
SELECT 
  'Meu User ID' as tipo,
  auth.uid() as meu_user_id;

-- 2. Ver meus dados como membro
SELECT 
  'Meus Dados como Membro' as tipo,
  id,
  owner_id,
  user_id,
  email,
  name,
  is_active
FROM team_members
WHERE user_id = auth.uid();

-- 3. Testar is_team_member com o owner_id
SELECT 
  'Teste is_team_member' as tipo,
  tm.owner_id,
  is_team_member(tm.owner_id) as resultado_funcao,
  tm.is_active as membro_ativo
FROM team_members tm
WHERE tm.user_id = auth.uid();

-- 4. Ver quantos pacientes o owner tem
SELECT 
  'Pacientes do Owner' as tipo,
  p.user_id as owner_id,
  COUNT(*) as total_pacientes
FROM patients p
WHERE p.user_id IN (
  SELECT owner_id FROM team_members WHERE user_id = auth.uid()
)
GROUP BY p.user_id;

-- 5. Testar query direta (sem função)
SELECT 
  'Teste Query Direta' as tipo,
  COUNT(*) as pacientes_visiveis
FROM patients p
WHERE p.user_id IN (
  SELECT tm.owner_id 
  FROM team_members tm
  WHERE tm.user_id = auth.uid() 
  AND tm.is_active = true
);

-- 6. Ver definição da função is_team_member
SELECT 
  'Definição da Função' as tipo,
  pg_get_functiondef(oid) as definicao
FROM pg_proc
WHERE proname = 'is_team_member';
