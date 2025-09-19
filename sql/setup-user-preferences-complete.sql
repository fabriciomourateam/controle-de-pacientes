-- Script completo para configurar tabela user_preferences com suporte a notificações

-- 1. Criar tabela de preferências do usuário (se não existir)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  filters JSONB DEFAULT '{}',
  sorting JSONB DEFAULT '{"field": "created_at", "direction": "desc"}',
  visible_columns TEXT[] DEFAULT ARRAY['nome', 'apelido', 'telefone', 'email', 'plano', 'data_vencimento', 'status', 'created_at'],
  page_size INTEGER DEFAULT 20,
  read_notifications JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar campo read_notifications se não existir (para tabelas já criadas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' 
                   AND column_name = 'read_notifications') THEN
        ALTER TABLE user_preferences ADD COLUMN read_notifications JSONB DEFAULT '[]';
    END IF;
END $$;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_preferences;
DROP POLICY IF EXISTS "Enable insert for all users" ON user_preferences;
DROP POLICY IF EXISTS "Enable update for all users" ON user_preferences;

-- 6. Criar políticas mais permissivas para desenvolvimento
CREATE POLICY "Enable read access for all users" ON user_preferences
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_preferences
  FOR UPDATE USING (true);

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger se não existir
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- 9. Comentários explicativos
COMMENT ON TABLE user_preferences IS 'Tabela para armazenar preferências do usuário incluindo notificações lidas';
COMMENT ON COLUMN user_preferences.user_id IS 'ID único do usuário (gerado pelo cliente)';
COMMENT ON COLUMN user_preferences.read_notifications IS 'Array de IDs das notificações que foram marcadas como lidas pelo usuário';

-- 10. Verificar se tudo foi criado corretamente
SELECT 
  'user_preferences table created successfully' as status,
  COUNT(*) as current_records
FROM user_preferences;
