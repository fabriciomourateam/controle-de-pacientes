-- =====================================================
-- SCRIPT DE MULTI-TENANCY - ISOLAMENTO DE DADOS POR USUÁRIO
-- =====================================================
-- Este script adiciona suporte para múltiplos usuários, onde cada usuário
-- só pode ver e gerenciar seus próprios dados.
--
-- IMPORTANTE: Execute este script em etapas e faça backup antes!
-- =====================================================

-- =====================================================
-- ETAPA 1: Adicionar coluna user_id nas tabelas principais
-- =====================================================

-- 1.1. Tabela patients (principal)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE patients 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
        
        RAISE NOTICE 'Coluna user_id adicionada à tabela patients';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela patients';
    END IF;
END $$;

-- 1.2. Tabela checkin
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkin' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE checkin 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_checkin_user_id ON checkin(user_id);
        
        -- Atualizar constraint única para incluir user_id
        ALTER TABLE checkin 
        DROP CONSTRAINT IF EXISTS unique_checkin_per_month;
        
        ALTER TABLE checkin 
        ADD CONSTRAINT unique_checkin_per_month_user 
        UNIQUE (user_id, telefone, mes_ano);
        
        RAISE NOTICE 'Coluna user_id adicionada à tabela checkin';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela checkin';
    END IF;
END $$;

-- 1.3. Tabela patient_feedback_records
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patient_feedback_records' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE patient_feedback_records 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_patient_feedback_user_id 
        ON patient_feedback_records(user_id);
        
        RAISE NOTICE 'Coluna user_id adicionada à tabela patient_feedback_records';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela patient_feedback_records';
    END IF;
END $$;

-- 1.4. Tabela dashboard_dados (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'dashboard_dados'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'dashboard_dados' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE dashboard_dados 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_dashboard_dados_user_id 
            ON dashboard_dados(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela dashboard_dados';
        ELSE
            RAISE NOTICE 'Coluna user_id já existe na tabela dashboard_dados';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela dashboard_dados não existe, pulando...';
    END IF;
END $$;

-- 1.5. Tabela leads_que_entraram (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads_que_entraram'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads_que_entraram' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE leads_que_entraram 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_leads_user_id 
            ON leads_que_entraram(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela leads_que_entraram';
        ELSE
            RAISE NOTICE 'Coluna user_id já existe na tabela leads_que_entraram';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela leads_que_entraram não existe, pulando...';
    END IF;
END $$;

-- =====================================================
-- ETAPA 2: Habilitar RLS (Row Level Security) nas tabelas
-- =====================================================

-- 2.1. Habilitar RLS na tabela patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;
DROP POLICY IF EXISTS "Users can only insert their own patients" ON patients;
DROP POLICY IF EXISTS "Users can only update their own patients" ON patients;
DROP POLICY IF EXISTS "Users can only delete their own patients" ON patients;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON patients;

-- Criar políticas RLS para patients
CREATE POLICY "Users can only see their own patients" ON patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own patients" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own patients" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own patients" ON patients
    FOR DELETE USING (auth.uid() = user_id);

-- 2.2. Habilitar RLS na tabela checkin
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can only see their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can only insert their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can only update their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can only delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON checkin;

-- Criar políticas RLS para checkin
CREATE POLICY "Users can only see their own checkins" ON checkin
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own checkins" ON checkin
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own checkins" ON checkin
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own checkins" ON checkin
    FOR DELETE USING (auth.uid() = user_id);

-- 2.3. Habilitar RLS na tabela patient_feedback_records
ALTER TABLE patient_feedback_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own feedback" ON patient_feedback_records;
DROP POLICY IF EXISTS "Users can only insert their own feedback" ON patient_feedback_records;
DROP POLICY IF EXISTS "Users can only update their own feedback" ON patient_feedback_records;
DROP POLICY IF EXISTS "Users can only delete their own feedback" ON patient_feedback_records;

CREATE POLICY "Users can only see their own feedback" ON patient_feedback_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own feedback" ON patient_feedback_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own feedback" ON patient_feedback_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own feedback" ON patient_feedback_records
    FOR DELETE USING (auth.uid() = user_id);

-- 2.4. RLS para dashboard_dados (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'dashboard_dados'
    ) THEN
        ALTER TABLE dashboard_dados ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own dashboard data" ON dashboard_dados;
        DROP POLICY IF EXISTS "Users can only insert their own dashboard data" ON dashboard_dados;
        DROP POLICY IF EXISTS "Users can only update their own dashboard data" ON dashboard_dados;
        DROP POLICY IF EXISTS "Users can only delete their own dashboard data" ON dashboard_dados;
        
        CREATE POLICY "Users can only see their own dashboard data" ON dashboard_dados
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own dashboard data" ON dashboard_dados
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own dashboard data" ON dashboard_dados
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own dashboard data" ON dashboard_dados
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2.5. RLS para leads_que_entraram (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads_que_entraram'
    ) THEN
        ALTER TABLE leads_que_entraram ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own leads" ON leads_que_entraram;
        DROP POLICY IF EXISTS "Users can only insert their own leads" ON leads_que_entraram;
        DROP POLICY IF EXISTS "Users can only update their own leads" ON leads_que_entraram;
        DROP POLICY IF EXISTS "Users can only delete their own leads" ON leads_que_entraram;
        
        CREATE POLICY "Users can only see their own leads" ON leads_que_entraram
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own leads" ON leads_que_entraram
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own leads" ON leads_que_entraram
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own leads" ON leads_que_entraram
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- ETAPA 3: Função para garantir user_id em inserts
-- =====================================================

-- Função para garantir que user_id seja sempre definido no insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger nas tabelas principais
DROP TRIGGER IF EXISTS set_user_id_patients ON patients;
CREATE TRIGGER set_user_id_patients
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_checkin ON checkin;
CREATE TRIGGER set_user_id_checkin
    BEFORE INSERT ON checkin
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_feedback ON patient_feedback_records;
CREATE TRIGGER set_user_id_feedback
    BEFORE INSERT ON patient_feedback_records
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- 
-- IMPORTANTE: Após executar este script, você precisa:
-- 1. Executar o script de migração de dados (migrate-existing-data.sql)
--    para vincular seus dados existentes ao seu usuário
-- 2. Testar o sistema para garantir que tudo está funcionando
-- 3. Atualizar o código TypeScript para garantir que user_id seja
--    sempre passado nas queries (embora o trigger já faça isso)
--
-- =====================================================

