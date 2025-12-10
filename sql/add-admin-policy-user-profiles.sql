-- Adicionar política RLS para permitir que o admin veja todos os perfis de usuários
-- Isso é necessário para a página de admin funcionar corretamente

-- Remover todas as políticas existentes de SELECT
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users and admin can view profiles" ON user_profiles;

-- Criar função auxiliar para verificar se o usuário é admin
-- SECURITY DEFINER permite que a função acesse auth.users
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'fabriciomouratreinador@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar política que permite:
-- 1. Usuários verem seu próprio perfil
-- 2. Admin ver todos os perfis
CREATE POLICY "Users and admin can view profiles" ON user_profiles
  FOR SELECT 
  USING (
    auth.uid() = id
    OR is_admin_user()
  );

-- Garantir que a política está ativa
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Comentário para documentação
COMMENT ON FUNCTION is_admin_user() IS 'Verifica se o usuário autenticado é o admin';
COMMENT ON POLICY "Users and admin can view profiles" ON user_profiles IS 
  'Permite que usuários vejam seu próprio perfil e o admin veja todos os perfis para a página de admin funcionar corretamente';

