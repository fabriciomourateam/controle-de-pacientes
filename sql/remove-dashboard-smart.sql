-- =====================================================
-- REMOVER TABELAS DO DASHBOARD - SCRIPT INTELIGENTE
-- =====================================================

-- Script que verifica o tipo de objeto antes de remover
-- Execute este script ANTES de executar o create-dashboard-tables

-- Função para remover objetos inteligentemente
DO $$
DECLARE
    obj_type TEXT;
    obj_name TEXT;
    objects_to_remove TEXT[] := ARRAY[
        'alertas_dashboard_ativos',
        'ultimos_6_meses', 
        'dashboard_saude',
        'dashboard_metricas',
        'alertas_dashboard',
        'dashboard_dados'
    ];
BEGIN
    -- Loop através de cada objeto
    FOREACH obj_name IN ARRAY objects_to_remove
    LOOP
        -- Verificar se é uma view
        SELECT 'VIEW' INTO obj_type
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = obj_name;
        
        IF FOUND THEN
            EXECUTE 'DROP VIEW IF EXISTS ' || obj_name || ' CASCADE';
            RAISE NOTICE 'Removida VIEW: %', obj_name;
        ELSE
            -- Verificar se é uma tabela
            SELECT 'TABLE' INTO obj_type
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = obj_name;
            
            IF FOUND THEN
                EXECUTE 'DROP TABLE IF EXISTS ' || obj_name || ' CASCADE';
                RAISE NOTICE 'Removida TABLE: %', obj_name;
            ELSE
                RAISE NOTICE 'Objeto não encontrado: %', obj_name;
            END IF;
        END IF;
    END LOOP;
    
    -- Remover funções
    DROP FUNCTION IF EXISTS gerar_alertas_dashboard() CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    
    RAISE NOTICE 'Funções removidas com sucesso!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro durante remoção: %', SQLERRM;
END $$;

-- Verificar se foi removido
SELECT 'Objetos removidos com sucesso!' as status;














