-- Criar tabela user_profiles para armazenar dados do perfil do usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  crm TEXT,
  clinic TEXT,
  address TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_crm ON user_profiles(crm);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários insiram apenas seu próprio perfil
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários atualizem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que usuários deletem apenas seu próprio perfil
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket para imagens de perfil (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens de perfil
CREATE POLICY "Users can upload own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid() IS NOT NULL
  );

-- Política para permitir visualização de imagens de perfil
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

-- Política para permitir atualização de imagens de perfil
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid() IS NOT NULL
  );

-- Política para permitir exclusão de imagens de perfil
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid() IS NOT NULL
  );

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Tabela para armazenar dados do perfil dos usuários';
COMMENT ON COLUMN user_profiles.id IS 'ID do usuário (vinculado ao auth.users)';
COMMENT ON COLUMN user_profiles.name IS 'Nome completo do usuário';
COMMENT ON COLUMN user_profiles.email IS 'E-mail do usuário';
COMMENT ON COLUMN user_profiles.phone IS 'Telefone do usuário';
COMMENT ON COLUMN user_profiles.specialty IS 'Especialidade profissional';
COMMENT ON COLUMN user_profiles.crm IS 'Número do CRM';
COMMENT ON COLUMN user_profiles.clinic IS 'Nome da clínica/consultório';
COMMENT ON COLUMN user_profiles.address IS 'Endereço da clínica/consultório';
COMMENT ON COLUMN user_profiles.bio IS 'Biografia do usuário';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL da foto de perfil';
COMMENT ON COLUMN user_profiles.created_at IS 'Data de criação do perfil';
COMMENT ON COLUMN user_profiles.updated_at IS 'Data da última atualização do perfil';
