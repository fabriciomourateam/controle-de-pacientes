-- =====================================================
-- ADICIONAR CAMPOS DE PESO EM JEJUM À TABELA CHECKIN
-- =====================================================
-- Permite pré-preenchimento de check-ins com peso em jejum

-- Adicionar campos se não existirem
DO $$ 
BEGIN
    -- Campo para peso em jejum (preferencial)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkin' AND column_name = 'peso_jejum'
    ) THEN
        ALTER TABLE checkin ADD COLUMN peso_jejum NUMERIC(5, 2) NULL;
        COMMENT ON COLUMN checkin.peso_jejum IS 'Peso em jejum do check-in (preferencial, mais confiável)';
    END IF;

    -- Campo para indicar se o peso foi de jejum
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkin' AND column_name = 'tipo_peso'
    ) THEN
        ALTER TABLE checkin ADD COLUMN tipo_peso TEXT NULL CHECK (tipo_peso IN ('jejum', 'dia'));
        COMMENT ON COLUMN checkin.tipo_peso IS 'Tipo de peso: jejum ou dia';
    END IF;

    -- Data do peso usado no check-in
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkin' AND column_name = 'peso_data'
    ) THEN
        ALTER TABLE checkin ADD COLUMN peso_data DATE NULL;
        COMMENT ON COLUMN checkin.peso_data IS 'Data em que o peso foi aferido';
    END IF;
END $$;

-- Criar índice para peso_jejum se não existir
CREATE INDEX IF NOT EXISTS idx_checkin_peso_jejum ON checkin(peso_jejum) WHERE peso_jejum IS NOT NULL;





