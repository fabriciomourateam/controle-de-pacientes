-- =====================================================
-- SCRIPT PARA VERIFICAR QUAIS TABELAS JÁ EXISTEM
-- =====================================================
-- Execute este script para ver o status das tabelas
-- =====================================================

-- 1. Verificar se weight_tracking existe
SELECT 
    'weight_tracking' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_tracking')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-weight-tracking-table.sql'
    END as status;

-- 2. Verificar se laboratory_exams existe
SELECT 
    'laboratory_exams' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'laboratory_exams')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-laboratory-exams.sql'
    END as status;

-- 3. Verificar se exam_types existe
SELECT 
    'exam_types' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_types')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-laboratory-exams.sql'
    END as status;

-- 4. Verificar se system_config existe
SELECT 
    'system_config' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute: create-config-table.sql'
    END as status;

-- 5. Verificar se checkin tem os campos novos
SELECT 
    'peso_jejum' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkin' AND column_name = 'peso_jejum'
        ) THEN '✅ peso_jejum existe'
        ELSE '❌ peso_jejum NÃO existe - Execute: add-checkin-weight-fields.sql'
    END as status
UNION ALL
SELECT 
    'tipo_peso' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkin' AND column_name = 'tipo_peso'
        ) THEN '✅ tipo_peso existe'
        ELSE '❌ tipo_peso NÃO existe - Execute: add-checkin-weight-fields.sql'
    END as status
UNION ALL
SELECT 
    'peso_data' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkin' AND column_name = 'peso_data'
        ) THEN '✅ peso_data existe'
        ELSE '❌ peso_data NÃO existe - Execute: add-checkin-weight-fields.sql'
    END as status;

-- 6. Verificar se weight_tracking tem user_id
SELECT 
    'weight_tracking.user_id' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'weight_tracking' AND column_name = 'user_id'
        ) THEN '✅ user_id existe'
        ELSE '❌ user_id NÃO existe - Já foi corrigido pelo fix-add-user-id-to-existing-tables.sql?'
    END as status;

-- 7. Verificar se laboratory_exams tem user_id
SELECT 
    'laboratory_exams.user_id' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'laboratory_exams' AND column_name = 'user_id'
        ) THEN '✅ user_id existe'
        ELSE '❌ user_id NÃO existe - Já foi corrigido pelo fix-add-user-id-to-existing-tables.sql?'
    END as status;

