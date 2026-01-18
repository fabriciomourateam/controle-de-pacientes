-- ============================================
-- DIAGNÓSTICO COMPLETO: Por que não consegue deletar?
-- ============================================

-- 1. Ver seu user_id atual
SELECT auth.uid() as meu_user_id;

-- 2. Ver um paciente de exemplo (pegue o ID de um que você quer deletar)
SELECT id, nome, telefone, user_id 
FROM patients 
LIMIT 5;

-- 3. Verificar se o user_id do paciente é igual ao seu
SELECT 
  p.id,
  p.nome,
  p.user_id as paciente_user_id,
  auth.uid() as meu_user_id,
  (p.user_id = auth.uid()) as sou_o_dono
FROM patients p
LIMIT 5;

-- 4. Ver TODAS as políticas da tabela patients
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'patients'
ORDER BY cmd, policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'patients';

-- 6. Testar se consegue ver o paciente (SELECT funciona?)
SELECT COUNT(*) as total_pacientes_visiveis
FROM patients;

-- 7. Verificar se há triggers que podem estar bloqueando
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'patients'
AND event_manipulation = 'DELETE';
