-- ============================================
-- CORRIGIR POLÍTICA DE PROFILES
-- ============================================

-- Cada usuário só pode ver seu próprio perfil
-- Isso garante privacidade e segurança dos dados

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Criar política correta: apenas próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
