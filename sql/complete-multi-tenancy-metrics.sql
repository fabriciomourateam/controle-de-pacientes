-- =====================================================
-- SCRIPT COMPLETO DE MULTI-TENANCY PARA MÉTRICAS
-- =====================================================
-- Este script garante isolamento total de dados por usuário
-- para todas as tabelas de métricas operacionais e comerciais
-- =====================================================

-- =====================================================
-- ETAPA 1: Adicionar user_id e triggers para dashboard_dados
-- =====================================================

-- Adicionar coluna user_id se não existir
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
    END IF;
END $$;

-- Criar trigger para garantir user_id em inserts
DROP TRIGGER IF EXISTS set_user_id_dashboard_dados ON dashboard_dados;
CREATE TRIGGER set_user_id_dashboard_dados
    BEFORE INSERT ON dashboard_dados
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- ETAPA 2: Adicionar user_id para tabelas de métricas comerciais
-- =====================================================

-- 2.1. leads_que_entraram
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
            
            CREATE INDEX IF NOT EXISTS idx_leads_que_entraram_user_id 
            ON leads_que_entraram(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela leads_que_entraram';
        END IF;
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_id_leads_que_entraram ON leads_que_entraram;
CREATE TRIGGER set_user_id_leads_que_entraram
    BEFORE INSERT ON leads_que_entraram
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- 2.2. Total de Leads
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Leads'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Total de Leads' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE "Total de Leads" 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_total_leads_user_id 
            ON "Total de Leads"(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela Total de Leads';
        END IF;
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_id_total_leads ON "Total de Leads";
CREATE TRIGGER set_user_id_total_leads
    BEFORE INSERT ON "Total de Leads"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- 2.3. Total de Calls Agendadas
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Calls Agendadas'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Total de Calls Agendadas' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE "Total de Calls Agendadas" 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_total_calls_user_id 
            ON "Total de Calls Agendadas"(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela Total de Calls Agendadas';
        END IF;
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_id_total_calls ON "Total de Calls Agendadas";
CREATE TRIGGER set_user_id_total_calls
    BEFORE INSERT ON "Total de Calls Agendadas"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- 2.4. Total de Vendas
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Vendas'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Total de Vendas' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE "Total de Vendas" 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_total_vendas_user_id 
            ON "Total de Vendas"(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela Total de Vendas';
        END IF;
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_id_total_vendas ON "Total de Vendas";
CREATE TRIGGER set_user_id_total_vendas
    BEFORE INSERT ON "Total de Vendas"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- 2.5. Total de Leads por Funil
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Leads por Funil'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Total de Leads por Funil' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE "Total de Leads por Funil" 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_leads_funil_user_id 
            ON "Total de Leads por Funil"(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela Total de Leads por Funil';
        END IF;
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_id_leads_funil ON "Total de Leads por Funil";
CREATE TRIGGER set_user_id_leads_funil
    BEFORE INSERT ON "Total de Leads por Funil"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- 2.6. Total de Agendamentos por Funil
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Agendamentos por Funil'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Total de Agendamentos por Funil' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE "Total de Agendamentos por Funil" 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_agend_funil_user_id 
            ON "Total de Agendamentos por Funil"(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela Total de Agendamentos por Funil';
        END IF;
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_id_agend_funil ON "Total de Agendamentos por Funil";
CREATE TRIGGER set_user_id_agend_funil
    BEFORE INSERT ON "Total de Agendamentos por Funil"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- ETAPA 3: Habilitar RLS (Row Level Security)
-- =====================================================

-- 3.1. RLS para dashboard_dados
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

-- 3.2. RLS para leads_que_entraram
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

-- 3.3. RLS para Total de Leads
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Leads'
    ) THEN
        ALTER TABLE "Total de Leads" ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own total leads" ON "Total de Leads";
        DROP POLICY IF EXISTS "Users can only insert their own total leads" ON "Total de Leads";
        DROP POLICY IF EXISTS "Users can only update their own total leads" ON "Total de Leads";
        DROP POLICY IF EXISTS "Users can only delete their own total leads" ON "Total de Leads";
        
        CREATE POLICY "Users can only see their own total leads" ON "Total de Leads"
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own total leads" ON "Total de Leads"
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own total leads" ON "Total de Leads"
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own total leads" ON "Total de Leads"
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3.4. RLS para Total de Calls Agendadas
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Calls Agendadas'
    ) THEN
        ALTER TABLE "Total de Calls Agendadas" ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own calls" ON "Total de Calls Agendadas";
        DROP POLICY IF EXISTS "Users can only insert their own calls" ON "Total de Calls Agendadas";
        DROP POLICY IF EXISTS "Users can only update their own calls" ON "Total de Calls Agendadas";
        DROP POLICY IF EXISTS "Users can only delete their own calls" ON "Total de Calls Agendadas";
        
        CREATE POLICY "Users can only see their own calls" ON "Total de Calls Agendadas"
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own calls" ON "Total de Calls Agendadas"
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own calls" ON "Total de Calls Agendadas"
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own calls" ON "Total de Calls Agendadas"
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3.5. RLS para Total de Vendas
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Vendas'
    ) THEN
        ALTER TABLE "Total de Vendas" ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own vendas" ON "Total de Vendas";
        DROP POLICY IF EXISTS "Users can only insert their own vendas" ON "Total de Vendas";
        DROP POLICY IF EXISTS "Users can only update their own vendas" ON "Total de Vendas";
        DROP POLICY IF EXISTS "Users can only delete their own vendas" ON "Total de Vendas";
        
        CREATE POLICY "Users can only see their own vendas" ON "Total de Vendas"
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own vendas" ON "Total de Vendas"
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own vendas" ON "Total de Vendas"
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own vendas" ON "Total de Vendas"
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3.6. RLS para Total de Leads por Funil
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Leads por Funil'
    ) THEN
        ALTER TABLE "Total de Leads por Funil" ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own leads funil" ON "Total de Leads por Funil";
        DROP POLICY IF EXISTS "Users can only insert their own leads funil" ON "Total de Leads por Funil";
        DROP POLICY IF EXISTS "Users can only update their own leads funil" ON "Total de Leads por Funil";
        DROP POLICY IF EXISTS "Users can only delete their own leads funil" ON "Total de Leads por Funil";
        
        CREATE POLICY "Users can only see their own leads funil" ON "Total de Leads por Funil"
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own leads funil" ON "Total de Leads por Funil"
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own leads funil" ON "Total de Leads por Funil"
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own leads funil" ON "Total de Leads por Funil"
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3.7. RLS para Total de Agendamentos por Funil
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Total de Agendamentos por Funil'
    ) THEN
        ALTER TABLE "Total de Agendamentos por Funil" ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own agend funil" ON "Total de Agendamentos por Funil";
        DROP POLICY IF EXISTS "Users can only insert their own agend funil" ON "Total de Agendamentos por Funil";
        DROP POLICY IF EXISTS "Users can only update their own agend funil" ON "Total de Agendamentos por Funil";
        DROP POLICY IF EXISTS "Users can only delete their own agend funil" ON "Total de Agendamentos por Funil";
        
        CREATE POLICY "Users can only see their own agend funil" ON "Total de Agendamentos por Funil"
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own agend funil" ON "Total de Agendamentos por Funil"
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own agend funil" ON "Total de Agendamentos por Funil"
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own agend funil" ON "Total de Agendamentos por Funil"
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- 
-- Este script garante:
-- ✅ Coluna user_id em todas as tabelas de métricas
-- ✅ Triggers automáticos para definir user_id em inserts
-- ✅ RLS (Row Level Security) ativo em todas as tabelas
-- ✅ Isolamento total de dados por usuário
--
-- IMPORTANTE: Após executar este script, execute também:
-- 1. sql/migrate-existing-data-to-user.sql (para migrar seus dados existentes)
-- 2. Teste o sistema para garantir que tudo está funcionando
--
-- =====================================================

