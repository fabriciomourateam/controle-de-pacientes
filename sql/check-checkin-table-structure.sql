-- Verificar estrutura da tabela checkin
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checkin' 
AND table_schema = 'public'
ORDER BY ordinal_position;