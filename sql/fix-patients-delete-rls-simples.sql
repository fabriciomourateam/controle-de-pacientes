-- ============================================
-- FIX SIMPLES: Permitir DELETE de pacientes
-- ============================================
-- Versão simplificada que permite apenas o OWNER deletar seus pacientes
-- (sem verificar membros da equipe)

-- 1. Remover políticas de DELETE existentes
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
DROP POLICY IF EXISTS "Team members can delete patients" ON patients;
DROP POLICY IF EXISTS "Allow delete for owners and team members" ON patients;
DROP POLICY IF EXISTS "Allow delete for owners" ON patients;

-- 2. Criar política SIMPLES de DELETE
-- Permite apenas o owner (user_id) deletar seus próprios pacientes
CREATE POLICY "Allow delete for owners"
ON patients
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
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
-- policyname: "Allow delete for owners"
-- cmd: DELETE
-- qual: (user_id = auth.uid())
