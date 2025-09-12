-- Modificar tabela checkin para aceitar TEXT em todos os campos
-- Isso permite que o N8N/Typebot envie qualquer formato de dados

-- Alterar campos numéricos para TEXT
ALTER TABLE checkin 
ALTER COLUMN peso TYPE TEXT,
ALTER COLUMN medida TYPE TEXT,
ALTER COLUMN pontos_treinos TYPE TEXT,
ALTER COLUMN pontos_cardios TYPE TEXT,
ALTER COLUMN pontos_descanso_entre_series TYPE TEXT,
ALTER COLUMN pontos_refeicao_livre TYPE TEXT,
ALTER COLUMN pontos_beliscos TYPE TEXT,
ALTER COLUMN pontos_agua TYPE TEXT,
ALTER COLUMN pontos_sono TYPE TEXT,
ALTER COLUMN pontos_qualidade_sono TYPE TEXT,
ALTER COLUMN pontos_stress TYPE TEXT,
ALTER COLUMN pontos_libido TYPE TEXT,
ALTER COLUMN total_pontuacao TYPE TEXT,
ALTER COLUMN percentual_aproveitamento TYPE TEXT;

-- Comentários para documentar a mudança
COMMENT ON COLUMN checkin.peso IS 'Peso do paciente - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.medida IS 'Medida do paciente - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_treinos IS 'Pontos de treino - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_cardios IS 'Pontos de cardio - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_descanso_entre_series IS 'Pontos de descanso - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_refeicao_livre IS 'Pontos de refeição livre - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_beliscos IS 'Pontos de beliscos - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_agua IS 'Pontos de água - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_sono IS 'Pontos de sono - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_qualidade_sono IS 'Pontos de qualidade do sono - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_stress IS 'Pontos de stress - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.pontos_libido IS 'Pontos de libido - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.total_pontuacao IS 'Total de pontuação - aceita texto para compatibilidade com N8N/Typebot';
COMMENT ON COLUMN checkin.percentual_aproveitamento IS 'Percentual de aproveitamento - aceita texto para compatibilidade com N8N/Typebot';
