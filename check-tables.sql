-- Script para verificar se as tabelas foram criadas corretamente

-- Verificar tabelas existentes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'dashboard_dados',
    'alertas_dashboard', 
    'system_config'
)
ORDER BY table_name;

-- Verificar views existentes
SELECT 
    table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
    'dashboard_metricas',
    'ultimos_6_meses'
)
ORDER BY table_name;

-- Verificar se a tabela dashboard_dados tem dados
SELECT COUNT(*) as total_registros FROM dashboard_dados;

-- Verificar estrutura da tabela dashboard_dados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dashboard_dados'
ORDER BY ordinal_position;













