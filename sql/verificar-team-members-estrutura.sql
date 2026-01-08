-- Verificar estrutura da tabela team_members
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'team_members' 
ORDER BY ordinal_position;

-- Verificar se existe dados na tabela
SELECT COUNT(*) as total_membros FROM team_members;

-- Verificar alguns registros de exemplo (se existirem)
SELECT id, name, email, last_access, created_at 
FROM team_members 
LIMIT 3;