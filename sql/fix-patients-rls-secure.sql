-- ============================================
-- CORREÇÃO RLS SEGURA: PATIENTS (SEM FALLBACK)
-- ============================================
-- Use este SQL DEPOIS de popular os user_id dos pacientes
-- Esta versão NÃO permite acesso a pacientes com user_id NULL
-- (mais segura, mas requer que todos os pacientes tenham user_id)

-- 1. Remover política antiga
DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON patients;

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

-- 3. Criar política SEGURA (sem fallback para user_id NULL)
CREATE POLICY "owners_and_team_can_view_patients"
ON patients FOR SELECT
TO authenticated
USING (
  -- Owner vê seus próprios pacientes
  user_id = auth.uid()
  OR
  -- Membro vê pacientes do owner
  (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  -- NOTA: Removido fallback user_id IS NULL para maior segurança
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
