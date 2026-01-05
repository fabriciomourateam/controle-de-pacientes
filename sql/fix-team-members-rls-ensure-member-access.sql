-- ============================================
-- GARANTIR ACESSO: MEMBROS PODEM VER SEU PRÓPRIO REGISTRO
-- ============================================
-- Este SQL garante que a política RLS permite que membros vejam seu próprio registro
-- Necessário para que a verificação de assinatura funcione corretamente

-- Verificar política atual
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY policyname;

-- Se a política team_members_select_complete não existir ou não estiver funcionando,
-- recriar ela garantindo que membros possam ver seu próprio registro
DROP POLICY IF EXISTS "team_members_select_complete" ON team_members;

-- Criar política que garante acesso do membro ao seu próprio registro
CREATE POLICY "team_members_select_complete"
ON team_members FOR SELECT
USING (
  -- Owner vê seus membros
  owner_id = auth.uid()
  OR
  -- Membro vê a si mesmo (CRÍTICO para verificação de assinatura)
  user_id = auth.uid()
  OR
  -- Membro vê outros membros do mesmo owner
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

-- Testar: membro deve conseguir ver seu próprio registro
-- Execute como membro da equipe
SELECT 
  'Teste de acesso próprio' as teste,
  user_id,
  name,
  email,
  owner_id,
  is_active
FROM team_members
WHERE user_id = auth.uid();

-- Testar: membro deve conseguir ver outros membros do mesmo owner
SELECT 
  'Teste de acesso a outros membros' as teste,
  user_id,
  name,
  email,
  owner_id,
  is_active
FROM team_members
WHERE owner_id IN (
  SELECT owner_id 
  FROM team_members 
  WHERE user_id = auth.uid() 
  AND is_active = true
  LIMIT 1
)
AND is_active = true;
