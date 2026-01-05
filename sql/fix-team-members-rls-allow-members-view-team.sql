-- ============================================
-- CORRIGIR RLS: MEMBROS PODEM VER OUTROS MEMBROS DA MESMA EQUIPE
-- ============================================
-- Este SQL permite que membros da equipe vejam outros membros do mesmo owner
-- Necessário para que o seletor de responsáveis funcione corretamente

-- Remover políticas antigas
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_select_simple" ON team_members;
DROP POLICY IF EXISTS "owners_and_members_can_view_team_members" ON team_members;

-- Criar nova política SELECT que permite:
-- 1. Owner ver seus membros
-- 2. Membro ver a si mesmo
-- 3. Membro ver outros membros do mesmo owner (NOVO!)
CREATE POLICY "team_members_select_complete"
ON team_members FOR SELECT
USING (
  -- Owner vê seus membros
  owner_id = auth.uid()
  OR
  -- Membro vê a si mesmo
  user_id = auth.uid()
  OR
  -- Membro vê outros membros do mesmo owner (NOVO!)
  owner_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
    LIMIT 1
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Verificar política criada
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY policyname;

-- Testar (execute como membro da equipe)
-- Deve retornar todos os membros da mesma equipe
SELECT 
  user_id,
  name,
  email,
  owner_id
FROM team_members
WHERE owner_id IN (
  SELECT owner_id 
  FROM team_members 
  WHERE user_id = auth.uid() 
  AND is_active = true
  LIMIT 1
)
AND is_active = true;
