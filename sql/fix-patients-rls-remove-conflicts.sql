-- ============================================
-- REMOVER CONFLITOS DE POLÍTICAS RLS
-- ============================================
-- Este script remove políticas conflitantes e mantém apenas a principal

-- 1. Verificar políticas existentes ANTES
SELECT 
  'Políticas ANTES' as status,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 2. Remover política conflitante (portal_patients_select_by_phone pode estar causando problemas)
-- Manter apenas se realmente necessário para o portal público
-- DROP POLICY IF EXISTS "portal_patients_select_by_phone" ON patients;

-- 3. Remover política patients_all que pode estar conflitando
DROP POLICY IF EXISTS "patients_all" ON patients;

-- 4. Garantir que a política principal está correta
DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON patients;

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
  -- Caso 3: Fallback temporário - pacientes sem user_id
  user_id IS NULL
);

-- 5. Verificar políticas DEPOIS
SELECT 
  'Políticas DEPOIS' as status,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;
