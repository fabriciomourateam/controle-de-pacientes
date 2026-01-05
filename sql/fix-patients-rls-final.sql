-- ============================================
-- CORREÇÃO RLS FINAL: PATIENTS
-- ============================================
-- Esta versão funciona mesmo quando o usuário logado é diferente
-- do user_id dos pacientes (útil para migração ou múltiplos owners)

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

-- 3. Criar política que permite:
--    - Owner ver seus próprios pacientes
--    - Membros ver pacientes do owner
--    - Fallback temporário para user_id NULL (dados antigos)
CREATE POLICY "owners_and_team_can_view_patients"
ON patients FOR SELECT
TO authenticated
USING (
  -- Caso 1: Owner vê seus próprios pacientes
  user_id = auth.uid()
  OR
  -- Caso 2: Membro vê pacientes do owner
  (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  OR
  -- Caso 3: Fallback temporário - pacientes sem user_id (dados antigos)
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

-- 6. Teste final: verificar acesso
SELECT 
  'Teste de acesso final' as teste,
  COUNT(*) as total_pacientes_visiveis,
  COUNT(*) FILTER (WHERE user_id = auth.uid()) as meus_pacientes,
  COUNT(*) FILTER (WHERE user_id = get_member_owner_id()) as pacientes_do_owner,
  COUNT(*) FILTER (WHERE user_id IS NULL) as pacientes_sem_user_id
FROM patients;
