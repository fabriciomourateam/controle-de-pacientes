-- =====================================================
-- TABELA DE CONTROLE DE PESO DIÁRIO
-- =====================================================
-- Permite registro diário de peso sem criar check-ins
-- Integra com check-ins para pré-preenchimento

CREATE TABLE IF NOT EXISTS weight_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  data_pesagem DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Peso em jejum (principal, preferencial)
  peso_jejum NUMERIC(5, 2) NULL,
  
  -- Peso do dia (opcional, quando não for jejum)
  peso_dia NUMERIC(5, 2) NULL,
  
  -- Tipo de peso registrado
  tipo TEXT NOT NULL CHECK (tipo IN ('jejum', 'dia')),
  
  -- Observações opcionais
  observacoes TEXT NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uma entrada por telefone e user_id por dia
  CONSTRAINT unique_weight_per_day UNIQUE (user_id, telefone, data_pesagem)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_weight_tracking_user_id ON weight_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_telefone ON weight_tracking(telefone);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_data ON weight_tracking(data_pesagem DESC);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_user_telefone_data ON weight_tracking(user_id, telefone, data_pesagem DESC);

-- Foreign key para patients
ALTER TABLE weight_tracking 
ADD CONSTRAINT weight_tracking_telefone_fkey 
FOREIGN KEY (telefone) REFERENCES patients(telefone) ON DELETE CASCADE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_weight_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weight_tracking_updated_at_trigger 
    BEFORE UPDATE ON weight_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_weight_tracking_updated_at();

-- Habilitar RLS
ALTER TABLE weight_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para multi-tenancy (isolamento por usuário)
CREATE POLICY "Users can view their own weight tracking" ON weight_tracking
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight tracking" ON weight_tracking
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight tracking" ON weight_tracking
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight tracking" ON weight_tracking
FOR DELETE USING (auth.uid() = user_id);

-- Trigger para garantir user_id automaticamente
DROP TRIGGER IF EXISTS set_user_id_weight_tracking ON weight_tracking;
CREATE TRIGGER set_user_id_weight_tracking
    BEFORE INSERT ON weight_tracking
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Comentários
COMMENT ON TABLE weight_tracking IS 'Controle diário de peso (jejum e não jejum)';
COMMENT ON COLUMN weight_tracking.peso_jejum IS 'Peso em jejum (principal, mais confiável)';
COMMENT ON COLUMN weight_tracking.peso_dia IS 'Peso do dia quando não for jejum (opcional)';
COMMENT ON COLUMN weight_tracking.tipo IS 'Tipo: jejum ou dia';

