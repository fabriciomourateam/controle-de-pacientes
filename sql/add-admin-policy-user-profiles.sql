-- Adicionar política RLS para permitir que o admin veja todos os perfis de usuários
-- Isso é necessário para a página de admin funcionar corretamente

-- Primeiro, remover a política antiga de SELECT se existir
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;

-- Criar nova política que permite:
-- 1. Usuários verem seu próprio perfil
-- 2. Admin ver todos os perfis
CREATE POLICY "Users and admin can view profiles" ON user_profiles
  FOR SELECT 
  USING (
    -- Permitir se o usuário está vendo seu próprio perfil
    auth.uid() = id
    OR
    -- OU se o usuário autenticado é o admin (verificado pelo email)
    (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = 'fabriciomouratreinador@gmail.com'
  );

-- Comentário para documentação
COMMENT ON POLICY "Users and admin can view profiles" ON user_profiles IS 
  'Permite que usuários vejam seu próprio perfil e o admin veja todos os perfis para a página de admin funcionar corretamente';

