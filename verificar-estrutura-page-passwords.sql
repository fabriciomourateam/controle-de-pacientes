-- Verificar a estrutura da tabela page_passwords
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'page_passwords'
ORDER BY ordinal_position;

