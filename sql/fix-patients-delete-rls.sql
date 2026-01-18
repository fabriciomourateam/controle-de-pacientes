-- ============================================
-- FIX: Permitir DELETE de pacientes
-- ============================================
-- Problema: Não consegue excluir pacientes da página de pacientes
-- Solução: Adicionar política de DELETE para owner e membros da equipe

-- 1. Remover política de DELETE existente (se houver)
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
DROP POLICY IF EXISTS "Team members can delete patients" ON patients;
DROP POLICY IF EXISTS "Allow delete for owners and team members" ON patients;

-- 2. Criar política de DELETE que permite:
--    - Owner deletar seus próprios pacientes
--    - Membros da equipe deletar pacientes do owner (se tiverem permissão)
CREATE POLICY "Allow delete for owners and team members"
ON patients
FOR DELETE
TO authenticated
USING (
  -- Owner pode deletar seus próprios pacientes
  user_id = auth.uid()
  OR
  -- Membros da equipe podem deletar pacientes do owner
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.member_user_id = auth.uid()
    AND tm.owner_user_id = patients.user_id
    AND tm.status = 'active'
    AND (
      -- Verificar se tem permissão de gerenciar pacientes
      tm.permissions->>'patients_manage' = 'true'
      OR
      -- Ou se é admin (tem todas as permissões)
      tm.permissions->>'is_admin' = 'true'
    )
  )
);

-- 3. Verificar políticas criadas
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
-- TESTE: Verificar se consegue deletar
-- ============================================
-- Execute este SELECT para ver se a política está funcionando:
-- SELECT id, nome, telefone FROM patients WHERE user_id = auth.uid() LIMIT 1;
-- Depois tente deletar um paciente de teste
