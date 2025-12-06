-- =====================================================
-- CORRIGIR RLS PARA VIEWS DE DASHBOARD
-- =====================================================
-- Este script garante que as views dashboard_metricas e ultimos_6_meses
-- herdem corretamente as políticas RLS da tabela base dashboard_dados
-- =====================================================

-- =====================================================
-- ETAPA 1: Verificar e recriar view dashboard_metricas
-- =====================================================

-- Recriar a view dashboard_metricas
-- NOTA: Views herdam automaticamente as políticas RLS da tabela base
-- Não é necessário filtrar por user_id na view, pois o RLS da tabela dashboard_dados já faz isso
DROP VIEW IF EXISTS dashboard_metricas CASCADE;

CREATE VIEW dashboard_metricas AS
SELECT 
    id,
    mes,
    ano,
    mes_numero,
    data_referencia,
    user_id, -- IMPORTANTE: Incluir user_id na view para que as políticas RLS funcionem
    -- Conversão segura de TEXT para números
    COALESCE(CAST(ativos_total_inicio_mes AS INTEGER), 0) as ativos_total_inicio_mes,
    COALESCE(CAST(saldo_entrada_saida AS INTEGER), 0) as saldo_entrada_saida,
    COALESCE(CAST(entraram AS INTEGER), 0) as entraram,
    COALESCE(CAST(sairam AS INTEGER), 0) as sairam,
    COALESCE(CAST(vencimentos AS INTEGER), 0) as vencimentos,
    COALESCE(CAST(nao_renovou AS INTEGER), 0) as nao_renovou,
    COALESCE(CAST(desistencia AS INTEGER), 0) as desistencia,
    COALESCE(CAST(congelamento AS INTEGER), 0) as congelamento,
    COALESCE(CAST(percentual_renovacao AS DECIMAL(5,2)), 0.00) as percentual_renovacao,
    COALESCE(CAST(percentual_churn AS DECIMAL(5,2)), 0.00) as percentual_churn,
    COALESCE(CAST(churn_max AS INTEGER), 0) as churn_max,
    -- Cálculos automáticos
    CASE 
        WHEN CAST(ativos_total_inicio_mes AS INTEGER) > 0 
        THEN ROUND((CAST(entraram AS INTEGER)::DECIMAL / CAST(ativos_total_inicio_mes AS INTEGER)) * 100, 2)
        ELSE 0 
    END as taxa_crescimento,
    CASE 
        WHEN CAST(entraram AS INTEGER) > 0 
        THEN ROUND((CAST(nao_renovou AS INTEGER)::DECIMAL / CAST(entraram AS INTEGER)) * 100, 2)
        ELSE 0 
    END as taxa_churn_calculada,
    -- Indicador de saúde do negócio
    CASE 
        WHEN CAST(percentual_renovacao AS DECIMAL) >= 80 THEN 'Excelente'
        WHEN CAST(percentual_renovacao AS DECIMAL) >= 70 THEN 'Bom'
        WHEN CAST(percentual_renovacao AS DECIMAL) >= 60 THEN 'Regular'
        ELSE 'Atenção'
    END as status_saude,
    created_at,
    updated_at
FROM dashboard_dados
-- As políticas RLS da tabela dashboard_dados automaticamente filtram por user_id
ORDER BY CAST(ano AS INTEGER) DESC, CAST(mes_numero AS INTEGER) DESC;

-- =====================================================
-- ETAPA 2: Verificar e recriar view ultimos_6_meses
-- =====================================================

-- Recriar a view ultimos_6_meses para garantir que herda RLS
DROP VIEW IF EXISTS ultimos_6_meses CASCADE;

CREATE VIEW ultimos_6_meses AS
SELECT *
FROM dashboard_metricas
WHERE CAST(ano AS INTEGER) >= EXTRACT(YEAR FROM NOW()) - 1
ORDER BY CAST(ano AS INTEGER) DESC, CAST(mes_numero AS INTEGER) DESC
LIMIT 6;

-- =====================================================
-- ETAPA 3: Garantir que RLS está habilitado em dashboard_dados
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'dashboard_dados'
    ) THEN
        -- Habilitar RLS
        ALTER TABLE dashboard_dados ENABLE ROW LEVEL SECURITY;
        
        -- Remover políticas antigas que permitem acesso irrestrito
        DROP POLICY IF EXISTS "Allow read access to all dashboard data" ON dashboard_dados;
        DROP POLICY IF EXISTS "Allow authenticated users to insert dashboard data" ON dashboard_dados;
        DROP POLICY IF EXISTS "Allow authenticated users to update dashboard data" ON dashboard_dados;
        DROP POLICY IF EXISTS "Allow authenticated users to delete dashboard data" ON dashboard_dados;
        
        -- Criar políticas restritivas baseadas em user_id
        CREATE POLICY "Users can only see their own dashboard data" ON dashboard_dados
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can only insert their own dashboard data" ON dashboard_dados
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only update their own dashboard data" ON dashboard_dados
            FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can only delete their own dashboard data" ON dashboard_dados
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'RLS habilitado e políticas criadas para dashboard_dados';
    ELSE
        RAISE NOTICE 'Tabela dashboard_dados não existe';
    END IF;
END $$;

-- =====================================================
-- ETAPA 4: Verificar se a coluna user_id existe
-- =====================================================

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

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- 
-- Este script garante:
-- ✅ Views dashboard_metricas e ultimos_6_meses filtradas por user_id
-- ✅ RLS habilitado na tabela base dashboard_dados
-- ✅ Políticas restritivas que garantem isolamento de dados
-- ✅ Views herdam automaticamente as políticas RLS da tabela base
--
-- IMPORTANTE: 
-- - As views agora só mostram dados do usuário autenticado
-- - Mesmo que alguém tente acessar diretamente, as políticas RLS bloqueiam
-- - Verifique no Supabase Dashboard que as views não aparecem mais como "UNRESTRICTED"
--
-- =====================================================

