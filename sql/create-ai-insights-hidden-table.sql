-- Tabela para guardar cards da IA que foram ocultados pelo nutricionista
-- Permite "deletar" cards da IA sem perder a capacidade de recalculá-los

CREATE TABLE IF NOT EXISTS ai_insights_hidden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL REFERENCES patients(telefone) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('strengths', 'warnings', 'goals')),
  ai_insight_hash TEXT NOT NULL, -- Hash do conteúdo do card da IA para identificá-lo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  UNIQUE(telefone, section, ai_insight_hash)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_insights_hidden_telefone ON ai_insights_hidden(telefone);
CREATE INDEX IF NOT EXISTS idx_ai_insights_hidden_user_id ON ai_insights_hidden(user_id);

-- RLS (Row Level Security)
ALTER TABLE ai_insights_hidden ENABLE ROW LEVEL SECURITY;

-- Política: Usuário pode ver apenas seus próprios registros
CREATE POLICY "Users can view their own hidden insights"
  ON ai_insights_hidden
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuário pode inserir seus próprios registros
CREATE POLICY "Users can insert their own hidden insights"
  ON ai_insights_hidden
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuário pode deletar seus próprios registros
CREATE POLICY "Users can delete their own hidden insights"
  ON ai_insights_hidden
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE ai_insights_hidden IS 'Guarda cards da IA que foram ocultados pelo nutricionista';
COMMENT ON COLUMN ai_insights_hidden.ai_insight_hash IS 'Hash MD5 do título+descrição do card da IA para identificá-lo';
