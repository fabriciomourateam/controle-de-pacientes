-- Diagnosticar acesso de membros à página de Reuniões

-- 1. Ver todos os membros cadastrados (simplificado)
SELECT 
  tm.id,
  tm.user_id,
  tm.owner_id,
  tm.email as member_email,
  tm.created_at
FROM team_members tm
ORDER BY tm.created_at DESC;

-- 2. Verificar se há membros ativos
SELECT COUNT(*) as total_membros FROM team_members;

-- 3. Ver estrutura da tabela team_members
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- 4. Verificar um user_id específico (substitua pelo ID do membro)
-- SELECT * FROM team_members WHERE user_id = 'COLE_O_USER_ID_AQUI';
