-- Trigger para criar automaticamente um perfil em user_profiles quando um usuário é criado em auth.users
-- Isso garante que todos os usuários tenham um perfil e apareçam na página de admin

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil básico para o novo usuário
  INSERT INTO public.user_profiles (id, name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Usuário'),
    NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar erro se perfil já existir
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentário para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil em user_profiles quando um novo usuário é criado em auth.users';

