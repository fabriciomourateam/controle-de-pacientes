-- ============================================
-- DIAGNÓSTICO: POR QUE NÃO CONSIGO VER PACIENTES?
-- ============================================

-- 1. Verificar qual é o usuário atual logado
SELECT 
  'Usuário logado atual' as info,
  auth.uid() as user_id_atual,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email_atual;

-- 2. Verificar quantos pacientes existem e seus user_id
SELECT 
  'Distribuição de pacientes' as info,
  COUNT(*) FILTER (WHERE user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b') as pacientes_do_seu_user_id,
  COUNT(*) FILTER (WHERE user_id = auth.uid()) as pacientes_do_usuario_logado,
  COUNT(*) FILTER (WHERE user_id IS NULL) as pacientes_sem_user_id,
  COUNT(*) as total_pacientes
FROM patients;

-- 3. Verificar se o usuário logado é o mesmo do user_id dos pacientes
SELECT 
  CASE 
    WHEN auth.uid() = 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid THEN '✅ Usuário logado CORRESPONDE ao user_id dos pacientes'
    ELSE '❌ Usuário logado NÃO corresponde ao user_id dos pacientes'
  END as status;

-- 4. Verificar se o usuário logado é membro da equipe
SELECT 
  'Membro da equipe?' as info,
  COUNT(*) > 0 as eh_membro,
  (SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1) as owner_da_equipe
FROM team_members
WHERE user_id = auth.uid()
  AND is_active = true;

-- 5. Testar a função get_member_owner_id()
SELECT 
  'Teste get_member_owner_id()' as info,
  get_member_owner_id() as owner_id_retornado,
  CASE 
    WHEN get_member_owner_id() = 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid THEN '✅ Função retorna o user_id correto'
    WHEN get_member_owner_id() IS NULL THEN '⚠️ Função retorna NULL (não é membro da equipe)'
    ELSE '❌ Função retorna outro ID'
  END as status_funcao;

-- 6. Testar política RLS diretamente
SELECT 
  'Teste de acesso RLS' as info,
  COUNT(*) as pacientes_visiveis
FROM patients
WHERE 
  -- Condição da política RLS
  (
    user_id = auth.uid()
    OR
    (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
    OR
    user_id IS NULL
  );

-- 7. Verificar políticas RLS ativas
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;
