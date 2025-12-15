-- ============================================
-- DIAGNÓSTICO - Verificar acesso do membro
-- ============================================

-- 1. Ver dados do membro logado
SELECT 
  'Membro Logado' as tipo,
  id,
  email,
  owner_id,
  user_id,
  name,
  role_id,
  is_active
FROM team_members
WHERE user_id = auth.uid();

-- 2. Ver owner_id do membro
SELECT 
  'Owner do Membro' as tipo,
  owner_id
FROM team_members
WHERE user_id = auth.uid();

-- 3. Ver quantos pacientes o owner tem
SELECT 
  'Pacientes do Owner' as tipo,
  COUNT(*) as total
FROM patients
WHERE user_id = (
  SELECT owner_id 
  FROM team_members 
  WHERE user_id = auth.uid()
);

-- 4. Ver políticas RLS de patients
SELECT 
  'Políticas RLS - Patients' as tipo,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'patients';

-- 5. Testar se a query funciona
SELECT 
  'Teste Query Pacientes' as tipo,
  id,
  nome,
  telefone
FROM patients
WHERE user_id IN (
  SELECT owner_id 
  FROM team_members 
  WHERE user_id = auth.uid() 
  AND is_active = true
)
LIMIT 5;

-- 6. Ver estrutura da tabela patients
SELECT 
  'Estrutura Patients' as tipo,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN ('id', 'user_id', 'nome', 'telefone')
ORDER BY ordinal_position;
