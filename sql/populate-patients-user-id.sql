-- ============================================
-- POPULAR user_id DOS PACIENTES
-- ============================================
-- Este script popula o campo user_id dos pacientes que estão NULL
-- com o ID do usuário atual (owner)

-- 1. Verificar quantos pacientes têm user_id NULL
SELECT 
  'Pacientes sem user_id' as status,
  COUNT(*) as total
FROM patients
WHERE user_id IS NULL;

-- 2. Verificar qual é o ID do usuário atual
SELECT 
  'Usuário atual' as info,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- 3. Popular user_id dos pacientes NULL com o usuário atual
-- ⚠️ ATENÇÃO: Isso vai associar TODOS os pacientes sem user_id ao usuário atual
-- Execute apenas se você for o owner de todos esses pacientes
UPDATE patients 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 4. Verificar resultado
SELECT 
  'Após atualização' as status,
  COUNT(*) FILTER (WHERE user_id = auth.uid()) as meus_pacientes,
  COUNT(*) FILTER (WHERE user_id IS NULL) as ainda_sem_user_id,
  COUNT(*) as total
FROM patients;

-- 5. Verificar alguns pacientes atualizados
SELECT 
  id,
  nome,
  telefone,
  user_id,
  created_at
FROM patients
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
