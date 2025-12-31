-- Adicionar colunas para dados atuais do paciente (fotos, peso, altura, medidas)
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas de fotos atuais
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS foto_atual_frente TEXT,
ADD COLUMN IF NOT EXISTS foto_atual_lado TEXT,
ADD COLUMN IF NOT EXISTS foto_atual_lado_2 TEXT,
ADD COLUMN IF NOT EXISTS foto_atual_costas TEXT,
ADD COLUMN IF NOT EXISTS data_fotos_atuais DATE;

-- Adicionar colunas de medidas atuais
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS peso_atual DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS altura_atual DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS medida_cintura_atual DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS medida_quadril_atual DECIMAL(6,2);

-- Comentários para documentação
COMMENT ON COLUMN patients.foto_atual_frente IS 'URL da foto frontal atual do paciente';
COMMENT ON COLUMN patients.foto_atual_lado IS 'URL da foto lateral atual do paciente';
COMMENT ON COLUMN patients.foto_atual_lado_2 IS 'URL da segunda foto lateral atual do paciente';
COMMENT ON COLUMN patients.foto_atual_costas IS 'URL da foto de costas atual do paciente';
COMMENT ON COLUMN patients.data_fotos_atuais IS 'Data em que as fotos atuais foram tiradas';
COMMENT ON COLUMN patients.peso_atual IS 'Peso atual do paciente em kg';
COMMENT ON COLUMN patients.altura_atual IS 'Altura atual do paciente em metros';
COMMENT ON COLUMN patients.medida_cintura_atual IS 'Medida atual da cintura em cm';
COMMENT ON COLUMN patients.medida_quadril_atual IS 'Medida atual do quadril em cm';
