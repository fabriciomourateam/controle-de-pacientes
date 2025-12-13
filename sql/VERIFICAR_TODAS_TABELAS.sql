-- =====================================================
-- VERIFICAÇÃO COMPLETA DE TABELAS E CAMPOS
-- =====================================================
-- Execute este script para ver TODOS os status
-- =====================================================

-- Criar tabela temporária para resultados
CREATE TEMP TABLE IF NOT EXISTS verificacao_resultados (
    categoria TEXT,
    item TEXT,
    status TEXT
);

-- Limpar resultados anteriores
DELETE FROM verificacao_resultados;

-- =====================================================
-- 1. VERIFICAR TABELAS PRINCIPAIS
-- =====================================================

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'TABELAS',
    'weight_tracking',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_tracking')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-weight-tracking-table.sql'
    END;

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'TABELAS',
    'laboratory_exams',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'laboratory_exams')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-laboratory-exams.sql'
    END;

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'TABELAS',
    'exam_types',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_types')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-laboratory-exams.sql'
    END;

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'TABELAS',
    'system_config',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-config-table.sql'
    END;

-- =====================================================
-- 2. VERIFICAR CAMPOS NO CHECKIN
-- =====================================================

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'CAMPOS CHECKIN',
    'peso_jejum',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkin' AND column_name = 'peso_jejum'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: add-checkin-weight-fields.sql'
    END;

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'CAMPOS CHECKIN',
    'tipo_peso',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkin' AND column_name = 'tipo_peso'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: add-checkin-weight-fields.sql'
    END;

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'CAMPOS CHECKIN',
    'peso_data',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkin' AND column_name = 'peso_data'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: add-checkin-weight-fields.sql'
    END;

-- =====================================================
-- 3. VERIFICAR user_id NAS NOVAS TABELAS
-- =====================================================

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'MULTI-TENANCY',
    'weight_tracking.user_id',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'weight_tracking' AND column_name = 'user_id'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: fix-add-user-id-to-existing-tables.sql'
    END;

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'MULTI-TENANCY',
    'laboratory_exams.user_id',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'laboratory_exams' AND column_name = 'user_id'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: fix-add-user-id-to-existing-tables.sql'
    END;

-- =====================================================
-- 4. VERIFICAR CONFIGURAÇÃO DE BRANDING
-- =====================================================

INSERT INTO verificacao_resultados (categoria, item, status)
SELECT 
    'CONFIGURAÇÕES',
    'pdf_branding (system_config)',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM system_config WHERE key = 'pdf_branding'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-branding-config.sql'
    END;

-- =====================================================
-- EXIBIR TODOS OS RESULTADOS
-- =====================================================

SELECT 
    categoria,
    item,
    status
FROM verificacao_resultados
ORDER BY 
    CASE categoria
        WHEN 'TABELAS' THEN 1
        WHEN 'CAMPOS CHECKIN' THEN 2
        WHEN 'MULTI-TENANCY' THEN 3
        WHEN 'CONFIGURAÇÕES' THEN 4
        ELSE 5
    END,
    item;

-- Limpar tabela temporária
DROP TABLE IF EXISTS verificacao_resultados;





