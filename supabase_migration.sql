-- Adiciona a coluna checkin_slug na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checkin_slug text UNIQUE;

-- Cria um índice para melhorar a performance da busca pelo slug
CREATE INDEX IF NOT EXISTS idx_profiles_checkin_slug ON profiles(checkin_slug);

-- Comentário para documentação
COMMENT ON COLUMN profiles.checkin_slug IS 'URL personalizada para o link de check-in (ex: nutricionista-joao)';
