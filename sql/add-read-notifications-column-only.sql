-- Adicionar apenas a coluna read_notifications na tabela user_preferences existente

-- 1. Verificar se a coluna já existe e adicionar se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences' 
        AND column_name = 'read_notifications'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN read_notifications JSONB DEFAULT '[]';
        
        RAISE NOTICE 'Coluna read_notifications adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna read_notifications já existe';
    END IF;
END $$;

-- 2. Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences' 
AND column_name = 'read_notifications';

-- 3. Mostrar estrutura atual da tabela
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences' 
ORDER BY ordinal_position;
