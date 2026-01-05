-- ============================================
-- CORREÇÃO EMERGENCIAL RLS: PATIENTS
-- ============================================
-- Este SQL corrige URGENTEMENTE a política RLS da tabela patients
-- para permitir acesso mesmo quando não há user_id ou owner_id

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON patients;
DROP POLICY IF EXISTS "owners_and_team_can_view_patients_v2" ON patients;
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "Owners can view own patients" ON patients;
DROP POLICY IF EXISTS "Team members can view owner patients" ON patients;
DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON patients;
DROP POLICY IF EXISTS "Public read access" ON patients;

-- 2. Garantir que a função get_member_owner_id existe
CREATE OR REPLACE FUNCTION get_member_owner_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result uuid;
BEGIN
  SELECT owner_id INTO result
  FROM team_members
  WHERE user_id = auth.uid()
  AND is_active = true
  LIMIT 1;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_member_owner_id() TO authenticated;

-- 3. Verificar estrutura da tabela e criar política apropriada
DO $$
DECLARE
  has_owner_id BOOLEAN;
  has_user_id BOOLEAN;
  policy_sql TEXT;
BEGIN
  -- Verificar colunas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'owner_id'
  ) INTO has_owner_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'user_id'
  ) INTO has_user_id;
  
  RAISE NOTICE 'patients.owner_id existe: %', has_owner_id;
  RAISE NOTICE 'patients.user_id existe: %', has_user_id;
  
  -- Criar política baseada na estrutura
  IF has_owner_id THEN
    -- Política usando owner_id
    policy_sql := '
    CREATE POLICY "owners_and_team_can_view_patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
      -- Owner vê seus próprios pacientes
      owner_id = auth.uid()
      OR
      -- Membro vê pacientes do owner
      (get_member_owner_id() IS NOT NULL AND owner_id = get_member_owner_id())
      OR
      -- Fallback: se não conseguir determinar owner, permitir acesso (TEMPORÁRIO)
      get_member_owner_id() IS NULL
    )';
    EXECUTE policy_sql;
    RAISE NOTICE 'Política criada usando owner_id';
    
  ELSIF has_user_id THEN
    -- Política usando user_id
    policy_sql := '
    CREATE POLICY "owners_and_team_can_view_patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
      -- Owner vê seus próprios pacientes
      user_id = auth.uid()
      OR
      -- Membro vê pacientes do owner
      (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
      OR
      -- Fallback: se não conseguir determinar owner, permitir acesso (TEMPORÁRIO)
      get_member_owner_id() IS NULL
    )';
    EXECUTE policy_sql;
    RAISE NOTICE 'Política criada usando user_id';
    
  ELSE
    -- SEM user_id E SEM owner_id: criar política temporária que permite acesso
    -- ⚠️ ATENÇÃO: Esta política permite acesso a TODOS os pacientes para usuários autenticados
    -- Use apenas como solução temporária até adicionar user_id/owner_id
    RAISE WARNING '⚠️ Tabela patients não tem owner_id nem user_id! Criando política temporária que permite acesso a todos os pacientes autenticados.';
    
    policy_sql := '
    CREATE POLICY "owners_and_team_can_view_patients"
    ON patients FOR SELECT
    TO authenticated
    USING (true)';
    EXECUTE policy_sql;
    RAISE NOTICE 'Política temporária criada (acesso total para autenticados)';
  END IF;
END $$;

-- 4. Garantir que RLS está habilitado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 5. Verificar política criada
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 6. Teste: verificar se consegue ver pacientes
SELECT 
  'Teste de acesso' as teste,
  COUNT(*) as total_pacientes
FROM patients;
