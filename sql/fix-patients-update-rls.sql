-- ============================================
-- CORRIGIR POLÍTICA RLS UPDATE: PATIENTS
-- ============================================
-- Este SQL cria a política RLS de UPDATE para permitir que
-- owners e membros da equipe possam atualizar pacientes

-- 1. Remover políticas de UPDATE antigas
DROP POLICY IF EXISTS "owners_and_team_can_update_patients" ON patients;
DROP POLICY IF EXISTS "Users can only update their own patients" ON patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON patients;

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

-- 3. Criar política UPDATE usando user_id (que sabemos que existe)
CREATE POLICY "owners_and_team_can_update_patients"
ON patients FOR UPDATE
TO authenticated
USING (
  -- Owner pode atualizar seus próprios pacientes
  user_id = auth.uid()
  OR
  -- Membro pode atualizar pacientes do owner
  (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  OR
  -- Fallback temporário: pacientes sem user_id (dados antigos)
  user_id IS NULL
)
WITH CHECK (
  -- Mesmas condições para garantir que não altere o user_id incorretamente
  user_id = auth.uid()
  OR
  (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  OR
  user_id IS NULL
);

-- 4. Verificar políticas criadas
SELECT 
  'Políticas UPDATE patients' as info,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patients'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 5. Teste: verificar se consegue fazer UPDATE
-- (Execute manualmente após verificar as políticas)
-- UPDATE patients 
-- SET peso_inicial = 83 
-- WHERE telefone = '5511989330147';
