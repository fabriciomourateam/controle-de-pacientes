-- DIAGNÓSTICO: Verificar função is_team_member
-- Execute no Supabase SQL Editor

-- 1. Ver definição da função is_team_member
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'is_team_member';

-- 2. Testar a função com seu user_id
SELECT is_team_member('a9798432-60bd-4ac8-a035-d139a47ad59b') as result;

-- 3. Verificar seu user_id atual
SELECT auth.uid() as current_user_id;

-- 4. Testar a condição da política diretamente
SELECT 
  id,
  name,
  user_id,
  (user_id = auth.uid()) as is_owner,
  is_team_member(user_id) as is_member_of_owner
FROM diet_plans
WHERE patient_id = '7261e2ad-bf7f-48ba-9967-9b9580c06bc5';

-- 5. Verificar se você consegue ver o plano com a política
SELECT * FROM diet_plans 
WHERE patient_id = '7261e2ad-bf7f-48ba-9967-9b9580c06bc5';
