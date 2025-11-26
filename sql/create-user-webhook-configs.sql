-- =====================================================
-- TABELA PARA CONFIGURAÇÕES DE WEBHOOK POR USUÁRIO
-- =====================================================

CREATE TABLE IF NOT EXISTS user_webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_type TEXT NOT NULL, -- 'autosync', 'metrics', 'commercial_metrics', etc
  webhook_url TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, webhook_type)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_webhook_configs_user_id ON user_webhook_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_webhook_configs_type ON user_webhook_configs(webhook_type);

-- Habilitar RLS
ALTER TABLE user_webhook_configs ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can only see their own webhook configs" ON user_webhook_configs;
DROP POLICY IF EXISTS "Users can only manage their own webhook configs" ON user_webhook_configs;

-- Políticas RLS
CREATE POLICY "Users can only see their own webhook configs" ON user_webhook_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own webhook configs" ON user_webhook_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own webhook configs" ON user_webhook_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own webhook configs" ON user_webhook_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_webhook_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_webhook_configs_updated_at
  BEFORE UPDATE ON user_webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_webhook_configs_updated_at();

