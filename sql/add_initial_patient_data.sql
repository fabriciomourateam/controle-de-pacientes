-- Adicionar colunas para dados iniciais do paciente (fotos, peso, altura, medidas)
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas de fotos iniciais
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS foto_inicial_frente TEXT,
ADD COLUMN IF NOT EXISTS foto_inicial_lado TEXT,
ADD COLUMN IF NOT EXISTS foto_inicial_costas TEXT,
ADD COLUMN IF NOT EXISTS data_fotos_iniciais DATE;

-- Adicionar colunas de medidas iniciais
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS peso_inicial DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS altura_inicial DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS medida_cintura_inicial DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS medida_quadril_inicial DECIMAL(6,2);

-- Comentários para documentação
COMMENT ON COLUMN patients.foto_inicial_frente IS 'URL da foto frontal inicial do paciente';
COMMENT ON COLUMN patients.foto_inicial_lado IS 'URL da foto lateral inicial do paciente';
COMMENT ON COLUMN patients.foto_inicial_costas IS 'URL da foto de costas inicial do paciente';
COMMENT ON COLUMN patients.data_fotos_iniciais IS 'Data em que as fotos iniciais foram tiradas';
COMMENT ON COLUMN patients.peso_inicial IS 'Peso inicial do paciente em kg';
COMMENT ON COLUMN patients.altura_inicial IS 'Altura inicial do paciente em metros';
COMMENT ON COLUMN patients.medida_cintura_inicial IS 'Medida inicial da cintura em cm';
COMMENT ON COLUMN patients.medida_quadril_inicial IS 'Medida inicial do quadril em cm';

