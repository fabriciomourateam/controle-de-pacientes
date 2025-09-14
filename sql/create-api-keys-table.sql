-- Criar tabela para API Keys
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions TEXT[] DEFAULT '{}',
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários só podem ver suas próprias chaves
CREATE POLICY "Users can view their own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT - usuários só podem criar chaves para si mesmos
CREATE POLICY "Users can create their own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - usuários só podem atualizar suas próprias chaves
CREATE POLICY "Users can update their own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE - usuários só podem excluir suas próprias chaves
CREATE POLICY "Users can delete their own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_hash ON user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_created_at ON user_api_keys(created_at);

-- Comentários para documentação
COMMENT ON TABLE user_api_keys IS 'Tabela para armazenar chaves de API dos usuários';
COMMENT ON COLUMN user_api_keys.key_hash IS 'Hash SHA-256 da chave API para segurança';
COMMENT ON COLUMN user_api_keys.permissions IS 'Array de permissões da chave (read, write, admin)';
COMMENT ON COLUMN user_api_keys.last_used IS 'Timestamp da última utilização da chave';
COMMENT ON COLUMN user_api_keys.expires_at IS 'Timestamp de expiração da chave (opcional)';
