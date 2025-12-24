-- Adicionar campo medida_quadril na tabela checkin
-- Execute este SQL no Supabase SQL Editor se quiser coletar medidas do quadril nos check-ins

DO $$ 
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkin' AND column_name = 'medida_quadril'
    ) THEN
        ALTER TABLE checkin ADD COLUMN medida_quadril NUMERIC(5, 2) NULL;
        COMMENT ON COLUMN checkin.medida_quadril IS 'Medida do quadril em cm';
        
        RAISE NOTICE 'Campo medida_quadril adicionado à tabela checkin';
    ELSE
        RAISE NOTICE 'Campo medida_quadril já existe na tabela checkin';
    END IF;
END $$;