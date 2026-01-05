-- ============================================
-- CORREÇÃO RLS SIMPLES: PATIENTS (USANDO user_id)
-- ============================================
-- Baseado no schema, a tabela patients TEM a coluna user_id
-- Este SQL cria uma política RLS que permite:
-- 1. Owner ver seus próprios pacientes (user_id = auth.uid())
-- 2. Membros da equipe ver pacientes do owner

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

-- 3. Criar política usando user_id (que sabemos que existe no schema)
CREATE POLICY "owners_and_team_can_view_patients"
ON patients FOR SELECT
TO authenticated
USING (
  -- Owner vê seus próprios pacientes
  user_id = auth.uid()
  OR
  -- Membro vê pacientes do owner (usando função auxiliar)
  (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  OR
  -- Fallback temporário: se user_id for NULL, permitir acesso
  -- (para pacientes antigos que podem não ter user_id preenchido)
  user_id IS NULL
);

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
  COUNT(*) as total_pacientes,
  COUNT(*) FILTER (WHERE user_id = auth.uid()) as meus_pacientes,
  COUNT(*) FILTER (WHERE user_id = get_member_owner_id()) as pacientes_do_owner
FROM patients;
