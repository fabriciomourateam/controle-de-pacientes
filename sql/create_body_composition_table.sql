-- Tabela para armazenar dados de composição corporal / bioimpedância
CREATE TABLE IF NOT EXISTS body_composition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT NOT NULL,
  data_avaliacao DATE NOT NULL,
  percentual_gordura DECIMAL(5,2) NOT NULL, -- Ex: 18.50
  classificacao TEXT, -- Ex: "Percentual de gordura mediano"
  peso DECIMAL(6,2), -- Peso na data da avaliação
  massa_magra DECIMAL(6,2), -- Calculado automaticamente
  massa_gorda DECIMAL(6,2), -- Calculado automaticamente
  imc DECIMAL(5,2), -- Calculado automaticamente
  tmb INTEGER, -- Taxa Metabólica Basal
  observacoes TEXT, -- Campo livre para anotações / texto completo do GPT
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Relacionamento com paciente
  CONSTRAINT fk_body_composition_patient FOREIGN KEY (telefone) 
    REFERENCES patients(telefone) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_body_composition_telefone ON body_composition(telefone);
CREATE INDEX IF NOT EXISTS idx_body_composition_data ON body_composition(data_avaliacao DESC);
CREATE INDEX IF NOT EXISTS idx_body_composition_telefone_data ON body_composition(telefone, data_avaliacao DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_body_composition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_body_composition_updated_at
BEFORE UPDATE ON body_composition
FOR EACH ROW
EXECUTE FUNCTION update_body_composition_updated_at();

-- Comentários na tabela
COMMENT ON TABLE body_composition IS 'Armazena dados de composição corporal obtidos via bioimpedância ou análise visual (GPT InShape)';
COMMENT ON COLUMN body_composition.percentual_gordura IS 'Percentual de gordura corporal';
COMMENT ON COLUMN body_composition.classificacao IS 'Classificação do shape retornada pelo GPT';
COMMENT ON COLUMN body_composition.peso IS 'Peso em kg no momento da avaliação';
COMMENT ON COLUMN body_composition.massa_magra IS 'Massa magra em kg (calculada)';
COMMENT ON COLUMN body_composition.massa_gorda IS 'Massa gorda em kg (calculada)';
COMMENT ON COLUMN body_composition.imc IS 'Índice de Massa Corporal';
COMMENT ON COLUMN body_composition.tmb IS 'Taxa Metabólica Basal em kcal/dia';
COMMENT ON COLUMN body_composition.observacoes IS 'Observações ou texto completo retornado pelo GPT InShape';

