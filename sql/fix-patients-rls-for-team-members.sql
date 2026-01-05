-- ============================================
-- CORRIGIR RLS: MEMBROS PODEM VER PACIENTES DO OWNER
-- ============================================
-- Este SQL corrige a política RLS da tabela patients para permitir que
-- membros da equipe vejam pacientes do owner, evitando erro 406

-- 1. Verificar qual coluna existe (user_id ou owner_id)
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_owner_id BOOLEAN;
BEGIN
  -- Verificar se existe coluna user_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'user_id'
  ) INTO has_user_id;
  
  -- Verificar se existe coluna owner_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'owner_id'
  ) INTO has_owner_id;
  
  RAISE NOTICE 'patients.user_id existe: %', has_user_id;
  RAISE NOTICE 'patients.owner_id existe: %', has_owner_id;
END $$;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON patients;
DROP POLICY IF EXISTS "owners_and_team_can_view_patients_v2" ON patients;
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "Owners can view own patients" ON patients;
DROP POLICY IF EXISTS "Team members can view owner patients" ON patients;
DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;

-- 3. Garantir que a função get_member_owner_id existe (criada em fix-team-members-rls-no-recursion.sql)
-- Se não existir, criar
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

-- Conceder permissão para usar a função
GRANT EXECUTE ON FUNCTION get_member_owner_id() TO authenticated;

-- 4. Criar política SELECT que funciona com user_id OU owner_id
-- Tenta usar owner_id primeiro, se não existir usa user_id
DO $$
DECLARE
  has_owner_id BOOLEAN;
  has_user_id BOOLEAN;
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
  
  -- Criar política baseada na coluna que existe
  IF has_owner_id THEN
    -- Se tem owner_id, usar owner_id
    EXECUTE '
    CREATE POLICY "owners_and_team_can_view_patients"
    ON patients FOR SELECT
    USING (
      -- Owner vê seus próprios pacientes
      owner_id = auth.uid()
      OR
      -- Membro vê pacientes do owner (usando função auxiliar para evitar recursão)
      owner_id = get_member_owner_id()
    )';
    RAISE NOTICE 'Política criada usando owner_id';
  ELSIF has_user_id THEN
    -- Se tem user_id, usar user_id
    EXECUTE '
    CREATE POLICY "owners_and_team_can_view_patients"
    ON patients FOR SELECT
    USING (
      -- Owner vê seus próprios pacientes
      user_id = auth.uid()
      OR
      -- Membro vê pacientes do owner (usando função auxiliar)
      user_id = get_member_owner_id()
    )';
    RAISE NOTICE 'Política criada usando user_id';
  ELSE
    -- Se não tem nenhuma, criar política temporária sem filtro (perigoso, mas necessário)
    RAISE WARNING 'Tabela patients não tem owner_id nem user_id! Criando política sem filtro (TEMPORÁRIA)';
    EXECUTE '
    CREATE POLICY "owners_and_team_can_view_patients"
    ON patients FOR SELECT
    USING (true)';
  END IF;
END $$;

-- 5. Garantir que RLS está habilitado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 6. Verificar política criada
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 7. Corrigir também body_composition se existir
DO $$
DECLARE
  has_body_comp BOOLEAN;
  has_owner_id BOOLEAN;
  has_user_id BOOLEAN;
BEGIN
  -- Verificar se tabela existe
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'body_composition'
  ) INTO has_body_comp;
  
  IF has_body_comp THEN
    -- Verificar colunas
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'body_composition' 
      AND column_name = 'owner_id'
    ) INTO has_owner_id;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'body_composition' 
      AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Remover políticas antigas
    EXECUTE 'DROP POLICY IF EXISTS "owners_and_team_can_view_body_composition" ON body_composition';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own body composition" ON body_composition';
    
    -- Criar nova política
    IF has_owner_id THEN
      EXECUTE '
      CREATE POLICY "owners_and_team_can_view_body_composition"
      ON body_composition FOR SELECT
      USING (
        owner_id = auth.uid()
        OR
        owner_id = get_member_owner_id()
      )';
    ELSIF has_user_id THEN
      EXECUTE '
      CREATE POLICY "owners_and_team_can_view_body_composition"
      ON body_composition FOR SELECT
      USING (
        user_id = auth.uid()
        OR
        user_id = get_member_owner_id()
      )';
    END IF;
    
    ALTER TABLE body_composition ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Política RLS corrigida para body_composition';
  END IF;
END $$;

-- 8. Corrigir também checkin se existir
DO $$
DECLARE
  has_checkin BOOLEAN;
  has_owner_id BOOLEAN;
  has_user_id BOOLEAN;
BEGIN
  -- Verificar se tabela existe
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'checkin'
  ) INTO has_checkin;
  
  IF has_checkin THEN
    -- Verificar colunas
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'checkin' 
      AND column_name = 'owner_id'
    ) INTO has_owner_id;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'checkin' 
      AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Remover políticas antigas
    EXECUTE 'DROP POLICY IF EXISTS "owners_and_team_can_view_checkins" ON checkin';
    EXECUTE 'DROP POLICY IF EXISTS "Users can only see their own checkins" ON checkin';
    EXECUTE 'DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON checkin';
    
    -- Criar nova política
    IF has_owner_id THEN
      EXECUTE '
      CREATE POLICY "owners_and_team_can_view_checkins"
      ON checkin FOR SELECT
      USING (
        owner_id = auth.uid()
        OR
        owner_id = get_member_owner_id()
      )';
    ELSIF has_user_id THEN
      EXECUTE '
      CREATE POLICY "owners_and_team_can_view_checkins"
      ON checkin FOR SELECT
      USING (
        user_id = auth.uid()
        OR
        user_id = get_member_owner_id()
      )';
    ELSE
      -- Se não tem owner_id nem user_id, criar política temporária
      -- (pode ser necessário se a tabela ainda não foi migrada)
      RAISE WARNING 'Tabela checkin não tem owner_id nem user_id! Criando política temporária';
      EXECUTE '
      CREATE POLICY "owners_and_team_can_view_checkins"
      ON checkin FOR SELECT
      USING (true)';
    END IF;
    
    ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Política RLS corrigida para checkin';
  END IF;
END $$;

-- 9. Testar: membro deve conseguir ver pacientes do owner
-- Execute como membro da equipe
SELECT 
  'Teste de acesso a pacientes' as teste,
  id,
  nome,
  telefone
FROM patients
LIMIT 5;
