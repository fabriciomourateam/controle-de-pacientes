-- =====================================================
-- FIX: ADICIONAR user_id EM TABELAS EXISTENTES
-- =====================================================
-- Execute este script se você já executou os SQLs anteriormente
-- e recebeu erro de coluna "user_id" não existe
-- =====================================================

-- 1. Verificar/criar função set_user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. ADICIONAR user_id EM weight_tracking (se não existir)
-- =====================================================
DO $$ 
BEGIN
    -- Adicionar coluna user_id se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'weight_tracking'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'weight_tracking' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE weight_tracking 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_weight_tracking_user_id 
            ON weight_tracking(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela weight_tracking';
        ELSE
            RAISE NOTICE 'Coluna user_id já existe na tabela weight_tracking';
        END IF;
    END IF;
END $$;

-- Remover constraint antiga se existir (fora do bloco DO)
ALTER TABLE weight_tracking 
DROP CONSTRAINT IF EXISTS unique_weight_per_day;

-- Adicionar nova constraint com user_id (após garantir que a coluna existe)
DO $$ 
BEGIN
    -- Verificar se a coluna user_id existe antes de criar constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'weight_tracking' AND column_name = 'user_id'
    ) THEN
        -- Tentar adicionar constraint (pode falhar se já existir, mas não é problema)
        BEGIN
            ALTER TABLE weight_tracking 
            ADD CONSTRAINT unique_weight_per_day_user 
            UNIQUE (user_id, telefone, data_pesagem);
            RAISE NOTICE 'Constraint única atualizada para incluir user_id';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint unique_weight_per_day_user já existe';
        END;
    END IF;
END $$;

-- =====================================================
-- 3. ADICIONAR user_id EM laboratory_exams (se não existir)
-- =====================================================
DO $$ 
BEGIN
    -- Adicionar coluna user_id se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'laboratory_exams'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'laboratory_exams' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE laboratory_exams 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_laboratory_exams_user_id 
            ON laboratory_exams(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela laboratory_exams';
        ELSE
            RAISE NOTICE 'Coluna user_id já existe na tabela laboratory_exams';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4. REMOVER POLÍTICAS RLS ANTIGAS (se existirem)
-- =====================================================
-- Remover políticas antigas de weight_tracking
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON weight_tracking;

-- Remover políticas antigas de laboratory_exams
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON laboratory_exams;

-- =====================================================
-- 5. CRIAR POLÍTICAS RLS CORRETAS (multi-tenancy)
-- =====================================================
-- Políticas para weight_tracking
CREATE POLICY "Users can view their own weight tracking" ON weight_tracking
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight tracking" ON weight_tracking
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight tracking" ON weight_tracking
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight tracking" ON weight_tracking
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para laboratory_exams
CREATE POLICY "Users can view their own exams" ON laboratory_exams
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams" ON laboratory_exams
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams" ON laboratory_exams
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams" ON laboratory_exams
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CRIAR TRIGGERS
-- =====================================================
-- Trigger para weight_tracking
DROP TRIGGER IF EXISTS set_user_id_weight_tracking ON weight_tracking;
CREATE TRIGGER set_user_id_weight_tracking
    BEFORE INSERT ON weight_tracking
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Trigger para laboratory_exams
DROP TRIGGER IF EXISTS set_user_id_laboratory_exams ON laboratory_exams;
CREATE TRIGGER set_user_id_laboratory_exams
    BEFORE INSERT ON laboratory_exams
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();





