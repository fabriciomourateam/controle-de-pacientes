-- Ver estrutura da tabela team_roles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_roles'
ORDER BY ordinal_position;
