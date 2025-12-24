-- Adicionar colunas para sistema de gestão de check-ins
-- Execute este script para ativar filtros de status e responsável

-- Adicionar coluna status se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkin' AND column_name = 'status') THEN
        ALTER TABLE checkin ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';
        RAISE NOTICE 'Coluna status adicionada';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;
END $$;

-- Adicionar coluna assigned_to se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkin' AND column_name = 'assigned_to') THEN
        ALTER TABLE checkin ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna assigned_to adicionada';
    ELSE
        RAISE NOTICE 'Coluna assigned_to já existe';
    END IF;
END $$;

-- Adicionar coluna locked_by se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkin' AND column_name = 'locked_by') THEN
        ALTER TABLE checkin ADD COLUMN locked_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna locked_by adicionada';
    ELSE
        RAISE NOTICE 'Coluna locked_by já existe';
    END IF;
END $$;

-- Adicionar coluna locked_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkin' AND column_name = 'locked_at') THEN
        ALTER TABLE checkin ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna locked_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna locked_at já existe';
    END IF;
END $$;

-- Adicionar coluna data_preenchimento se não existir (usada no frontend)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkin' AND column_name = 'data_preenchimento') THEN
        ALTER TABLE checkin ADD COLUMN data_preenchimento TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna data_preenchimento adicionada';
    ELSE
        RAISE NOTICE 'Coluna data_preenchimento já existe';
    END IF;
END $$;

-- Inicializar status para check-ins existentes
UPDATE checkin SET status = 'pendente' WHERE status IS NULL;

-- Finalizado!
SELECT 'Colunas do sistema de gestão adicionadas com sucesso!' as resultado;