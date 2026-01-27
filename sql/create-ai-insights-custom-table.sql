-- Tabela para armazenar insights customizados da análise IA
-- Permite que nutricionistas editem, adicionem e excluam cards da análise

CREATE TABLE IF NOT EXISTS ai_insights_custom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  section TEXT NOT NULL CHECK (section IN ('strengths', 'warnings', 'goals')),
  icon TEXT NOT NULL, -- emoji do card
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')), -- apenas para warnings
  order_index INTEGER DEFAULT 0, -- para ordenação customizada
  is_manual BOOLEAN DEFAULT true, -- se foi criado manualmente (não pela IA)
  is_hidden BOOLEAN DEFAULT false, -- soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_telefone ON ai_insights_custom(telefone);
CREATE INDEX IF NOT EXISTS idx_ai_insights_section ON ai_insights_custom(section);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights_custom(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_hidden ON ai_insights_custom(is_hidden) WHERE is_hidden = false;

-- Comentários
COMMENT ON TABLE ai_insights_custom IS 'Insights customizados da análise IA - permite edição manual dos cards';
COMMENT ON COLUMN ai_insights_custom.section IS 'Seção do insight: strengths (Pontos Fortes), warnings (Pontos de Atenção), goals (Próximas Metas)';
COMMENT ON COLUMN ai_insights_custom.icon IS 'Emoji que aparece no card';
COMMENT ON COLUMN ai_insights_custom.order_index IS 'Ordem de exibição do card (menor = primeiro)';
COMMENT ON COLUMN ai_insights_custom.is_manual IS 'true = criado manualmente, false = gerado pela IA e depois editado';
COMMENT ON COLUMN ai_insights_custom.is_hidden IS 'true = card foi excluído (soft delete)';

-- Habilitar RLS
ALTER TABLE ai_insights_custom ENABLE ROW LEVEL SECURITY;

-- Policy: Nutricionista pode gerenciar seus próprios insights
CREATE POLICY "Users can manage their own insights"
  ON ai_insights_custom
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Acesso público para leitura (portal público do paciente)
CREATE POLICY "Public can view insights"
  ON ai_insights_custom
  FOR SELECT
  USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_insights_updated_at_trigger
  BEFORE UPDATE ON ai_insights_custom
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_insights_updated_at();

-- Comentário final
COMMENT ON POLICY "Users can manage their own insights" ON ai_insights_custom IS 'Nutricionista pode criar, editar e excluir seus próprios insights';
COMMENT ON POLICY "Public can view insights" ON ai_insights_custom IS 'Qualquer pessoa pode visualizar insights (necessário para portal público)';
