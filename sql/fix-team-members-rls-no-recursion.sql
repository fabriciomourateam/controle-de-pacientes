-- ============================================
-- CORRIGIR RLS: REMOVER RECURSÃO INFINITA
-- ============================================
-- O problema: A política está consultando team_members dentro de si mesma
-- Solução: Usar função auxiliar ou política sem subquery recursiva

-- 1. Remover política problemática
DROP POLICY IF EXISTS "team_members_select_complete" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_select_simple" ON team_members;
DROP POLICY IF EXISTS "owners_and_members_can_view_team_members" ON team_members;

-- 2. Criar função auxiliar para obter owner_id do membro atual
-- Esta função evita recursão porque usa SECURITY DEFINER
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

-- 3. Criar política SELECT sem recursão
-- Usa a função auxiliar que não causa recursão
CREATE POLICY "team_members_select_no_recursion"
ON team_members FOR SELECT
USING (
  -- Owner vê seus membros
  owner_id = auth.uid()
  OR
  -- Membro vê a si mesmo
  user_id = auth.uid()
  OR
  -- Membro vê outros membros do mesmo owner (usando função auxiliar)
  owner_id = get_member_owner_id()
);

-- 4. Garantir que RLS está habilitado
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 5. Conceder permissão para usar a função
GRANT EXECUTE ON FUNCTION get_member_owner_id() TO authenticated;

-- 6. Verificar política criada
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY policyname;

-- 7. Testar: membro deve conseguir ver seu próprio registro
SELECT 
  'Teste de acesso próprio' as teste,
  user_id,
  name,
  email,
  owner_id,
  is_active
FROM team_members
WHERE user_id = auth.uid();

-- 8. Testar: membro deve conseguir ver outros membros do mesmo owner
SELECT 
  'Teste de acesso a outros membros' as teste,
  user_id,
  name,
  email,
  owner_id,
  is_active
FROM team_members
WHERE owner_id = get_member_owner_id()
AND is_active = true;
