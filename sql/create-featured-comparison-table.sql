-- Tabela para armazenar comparações destacadas (Antes/Depois)
CREATE TABLE IF NOT EXISTS featured_photo_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL,
  
  -- Foto "Antes"
  before_photo_url TEXT NOT NULL,
  before_photo_date DATE NOT NULL,
  before_weight NUMERIC(5,2),
  
  -- Foto "Depois"
  after_photo_url TEXT NOT NULL,
  after_photo_date DATE NOT NULL,
  after_weight NUMERIC(5,2),
  
  -- Configurações
  is_visible BOOLEAN DEFAULT true, -- Se deve aparecer no portal público
  title TEXT DEFAULT 'Minha Transformação', -- Título personalizável
  description TEXT, -- Descrição opcional
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir apenas uma comparação por paciente
  UNIQUE(telefone)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_featured_comparison_telefone ON featured_photo_comparison(telefone);
CREATE INDEX IF NOT EXISTS idx_featured_comparison_visible ON featured_photo_comparison(telefone, is_visible);

-- RLS Policies
ALTER TABLE featured_photo_comparison ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ver suas próprias comparações
CREATE POLICY "Users can view own featured comparison"
  ON featured_photo_comparison
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM patients WHERE telefone = featured_photo_comparison.telefone
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patients WHERE telefone = featured_photo_comparison.telefone
    )
  );

-- Policy: Usuários autenticados podem criar/atualizar suas comparações
CREATE POLICY "Users can manage own featured comparison"
  ON featured_photo_comparison
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM patients WHERE telefone = featured_photo_comparison.telefone
    )
  );

-- Policy: Service role pode acessar tudo (para página pública)
CREATE POLICY "Service role can access all"
  ON featured_photo_comparison
  FOR SELECT
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_featured_comparison_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_featured_comparison_timestamp
  BEFORE UPDATE ON featured_photo_comparison
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_comparison_updated_at();

-- Comentários
COMMENT ON TABLE featured_photo_comparison IS 'Armazena comparações destacadas (Antes/Depois) para exibição no portal público';
COMMENT ON COLUMN featured_photo_comparison.is_visible IS 'Se true, a comparação aparece no portal público';
COMMENT ON COLUMN featured_photo_comparison.title IS 'Título personalizável da transformação';
COMMENT ON COLUMN featured_photo_comparison.description IS 'Descrição opcional da jornada';
