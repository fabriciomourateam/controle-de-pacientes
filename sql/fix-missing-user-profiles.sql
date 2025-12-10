-- Script para criar perfis em user_profiles para usuários que já existem em auth.users
-- mas não têm um perfil criado. Isso corrige o problema de nutricionistas que não aparecem no admin.

-- Primeiro, criar a função se não existir (pode ser útil para casos futuros)
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

-- Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.user_profiles (id, name, email, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'Usuário'),
  u.email,
  COALESCE(u.created_at, NOW())
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Criar trigger para futuros usuários (se ainda não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Mostrar quantos perfis foram criados
DO $$
DECLARE
  created_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO created_count
  FROM auth.users u
  INNER JOIN public.user_profiles up ON u.id = up.id
  WHERE up.created_at >= NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Perfis criados/atualizados: %', created_count;
END $$;

