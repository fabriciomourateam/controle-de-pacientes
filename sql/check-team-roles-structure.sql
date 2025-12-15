-- Verificar estrutura da tabela team_roles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'team_roles'
ORDER BY ordinal_position;
