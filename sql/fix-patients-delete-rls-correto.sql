-- ============================================
-- FIX CORRETO: Permitir DELETE de pacientes
-- ============================================
-- Baseado na estrutura real da tabela team_members:
-- - owner_id: UUID do dono
-- - user_id: UUID do membro da equipe
-- - permissions: JSONB com permissões

-- 1. Remover políticas de DELETE existentes
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
DROP POLICY IF EXISTS "Team members can delete patients" ON patients;
DROP POLICY IF EXISTS "Allow delete for owners and team members" ON patients;
DROP POLICY IF EXISTS "Allow delete for owners" ON patients;

-- 2. Criar política de DELETE que permite:
--    - Owner deletar seus próprios pacientes
--    - Membros da equipe deletar pacientes do owner (se tiverem permissão)
CREATE POLICY "Allow delete for owners and team members"
ON patients
FOR DELETE
TO authenticated
USING (
  -- Owner pode deletar seus próprios pacientes
  patients.user_id = auth.uid()
  OR
  -- Membros da equipe podem deletar pacientes do owner
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.owner_id = patients.user_id
    AND tm.is_active = true
    AND (
      -- Verificar se tem permissão de gerenciar pacientes
      tm.permissions->>'patients_manage' = 'true'
      OR
      -- Ou se é admin (tem todas as permissões)
      tm.permissions->>'is_admin' = 'true'
    )
  )
);

-- 3. Verificar política criada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'patients' 
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Você deve ver:
-- policyname: "Allow delete for owners and team members"
-- cmd: DELETE
-- qual: ((user_id = auth.uid()) OR (EXISTS ...))
